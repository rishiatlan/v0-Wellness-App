import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/server-auth"
import { INITIAL_ADMIN_EMAILS } from "@/lib/admin-utils"

// This endpoint will force setup the admin_users table and add the initial admins
export async function GET(request: Request) {
  try {
    const serviceClient = createServiceRoleClient()

    // Check if admin_users table exists
    const { data: tableExists, error: tableCheckError } = await serviceClient.rpc("execute_sql", {
      sql_query: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'admin_users'
        );
      `,
    })

    if (tableCheckError) {
      return NextResponse.json(
        { error: "Error checking if table exists", details: tableCheckError.message },
        { status: 500 },
      )
    }

    // Create the admin_users table if it doesn't exist
    const { error: createTableError } = await serviceClient.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS admin_users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email TEXT NOT NULL UNIQUE,
          user_id UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (createTableError) {
      return NextResponse.json(
        { error: "Error creating admin_users table", details: createTableError.message },
        { status: 500 },
      )
    }

    // Insert initial admins
    const insertResults = []

    for (const adminEmail of INITIAL_ADMIN_EMAILS) {
      // Try to find the user ID
      const { data: userData, error: userError } = await serviceClient
        .from("users")
        .select("id")
        .eq("email", adminEmail)
        .maybeSingle()

      const userId = userData?.id || null

      // Insert the admin
      const { data: insertData, error: insertError } = await serviceClient
        .from("admin_users")
        .upsert({
          email: adminEmail.toLowerCase(),
          user_id: userId,
        })
        .select()

      insertResults.push({
        email: adminEmail,
        userId,
        success: !insertError,
        error: insertError ? insertError.message : null,
        data: insertData,
      })
    }

    // Set up RLS policies
    const { error: rlsError } = await serviceClient.rpc("execute_sql", {
      sql_query: `
        -- Enable RLS
        ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
        DROP POLICY IF EXISTS "Admins can insert admin users" ON admin_users;
        DROP POLICY IF EXISTS "Admins can delete admin users" ON admin_users;
        DROP POLICY IF EXISTS "Service role can manage admin users" ON admin_users;
        
        -- Allow admins to view all admin users
        CREATE POLICY "Admins can view all admin users"
        ON admin_users
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM admin_users WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
          )
        );
        
        -- Allow admins to insert new admin users
        CREATE POLICY "Admins can insert admin users"
        ON admin_users
        FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM admin_users WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
          )
        );
        
        -- Allow admins to delete admin users
        CREATE POLICY "Admins can delete admin users"
        ON admin_users
        FOR DELETE
        USING (
          EXISTS (
            SELECT 1 FROM admin_users WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
          )
        );
        
        -- Allow service role to manage all admin users
        CREATE POLICY "Service role can manage admin users"
        ON admin_users
        USING (auth.jwt() ->> 'role' = 'service_role');
      `,
    })

    if (rlsError) {
      return NextResponse.json({ error: "Error setting up RLS policies", details: rlsError.message }, { status: 500 })
    }

    // Create is_admin function
    const { error: functionError } = await serviceClient.rpc("execute_sql", {
      sql_query: `
        CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1 FROM admin_users WHERE LOWER(email) = LOWER(user_email)
          );
        END;
        $$ LANGUAGE plpgsql;
      `,
    })

    if (functionError) {
      return NextResponse.json(
        { error: "Error creating is_admin function", details: functionError.message },
        { status: 500 },
      )
    }

    // Verify the setup by checking if admins exist
    const { data: admins, error: verifyError } = await serviceClient.from("admin_users").select("*").order("email")

    if (verifyError) {
      return NextResponse.json({ error: "Error verifying admin setup", details: verifyError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Admin table setup successfully",
      tableExisted: tableExists,
      insertResults,
      admins,
    })
  } catch (error: any) {
    console.error("Setup admin endpoint error:", error)
    return NextResponse.json({ error: "Setup admin endpoint error", details: error.message }, { status: 500 })
  }
}
