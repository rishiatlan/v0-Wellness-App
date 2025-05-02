# Spring Wellness App

![Spring Wellness Logo](/public/wellness-logo.png)

A comprehensive wellness tracking and team challenge platform designed to promote healthy habits and team building.

## 🌟 Overview

Spring Wellness App is an enterprise wellness platform that allows users to:
- Track daily wellness activities
- Participate in team challenges
- View personal progress and statistics
- Compete on leaderboards
- Earn rewards and recognition

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [Database](#database)
- [API Routes](#api-routes)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

- **User Authentication**: Secure email/password authentication with Supabase
- **Daily Activity Tracking**: Log wellness activities like hydration, exercise, etc.
- **Progress Visualization**: Calendar views and statistics for personal progress
- **Team Challenges**: Collaborative wellness challenges for teams
- **Leaderboards**: Individual and team rankings
- **Admin Dashboard**: Manage users, teams, and application settings
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase Functions
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Hosting**: Vercel
- **State Management**: React Context API
- **Styling**: Tailwind CSS, shadcn/ui components

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- pnpm (v7+)
- Supabase account

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/your-org/spring-wellness-app.git
   cd spring-wellness-app
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   pnpm install
   \`\`\`

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_APP_VERSION=1.0.0
   \`\`\`

4. Run the development server:
   \`\`\`bash
   pnpm dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

\`\`\`
spring-wellness-app/
├── app/                    # Next.js App Router
│   ├── actions/            # Server actions
│   ├── api/                # API routes
│   ├── auth/               # Authentication pages
│   ├── daily-tracker/      # Daily activity tracking
│   ├── leaderboard/        # Leaderboard pages
│   ├── my-progress/        # User progress pages
│   ├── profile/            # User profile
│   ├── team-challenge/     # Team challenge pages
│   └── layout.tsx          # Root layout
├── components/             # Reusable components
│   ├── ui/                 # UI components
│   └── ...                 # Feature-specific components
├── lib/                    # Utility functions and hooks
├── public/                 # Static assets
├── sql/                    # SQL scripts for database setup
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
│   └── supabase/           # Supabase utilities
└── ...                     # Config files
\`\`\`

## 🔐 Authentication

The app uses Supabase Authentication with the following flows:

### Email/Password Authentication

- **Sign Up**: `/auth/register`
- **Sign In**: `/auth/login`
- **Password Reset**: `/auth/reset-password`
- **Email Confirmation**: Handled via `/auth/callback`

### Authentication Debugging

If you encounter authentication issues:

1. Check browser console for errors
2. Verify Supabase configuration in Supabase dashboard
3. Ensure email templates are correctly configured
4. Check redirect URLs in Supabase Auth settings
5. Use the `/api/debug-auth-status` endpoint to check auth status

## 💾 Database

The app uses Supabase PostgreSQL database with the following main tables:

- `users`: User profiles
- `activities`: Activity definitions
- `daily_logs`: User activity logs
- `teams`: Team information
- `team_members`: Team membership
- `challenges`: Challenge definitions
- `admin_users`: Admin privileges

### Database Debugging

If you encounter database issues:

1. Check Supabase dashboard for table structure
2. Verify RLS policies are correctly set up
3. Use SQL scripts in `/sql` directory to reset or initialize tables
4. Check the health endpoint at `/api/health` for database status

## 🔄 API Routes

Key API routes for debugging:

- `/api/health`: System health check
- `/api/debug-auth-status`: Authentication status
- `/api/debug-teams`: Team structure debugging
- `/api/log-error`: Client-side error logging
- `/api/ensure-db-setup`: Database initialization

## ❓ Troubleshooting

### Common Issues

#### Authentication Issues

- **Problem**: "Error refreshing session"
  - **Solution**: Check that auth context is properly initialized and the refreshSession function is available

- **Problem**: Email confirmation links not working
  - **Solution**: Verify Supabase URL and redirect settings in Supabase dashboard

- **Problem**: Password reset not working
  - **Solution**: Check the reset password flow in `/auth/reset-password/confirm` and verify token handling

#### Database Issues

- **Problem**: "Error: relation does not exist"
  - **Solution**: Run the database setup scripts in the `/sql` directory

- **Problem**: "Permission denied for relation"
  - **Solution**: Check RLS policies in Supabase dashboard

#### Performance Issues

- **Problem**: Slow page loads
  - **Solution**: Check network requests, database query performance, and component rendering

- **Problem**: High memory usage
  - **Solution**: Look for memory leaks in useEffect cleanup functions

### Debugging Tools

- **Browser DevTools**: Check console for errors and network requests
- **Supabase Dashboard**: Examine database tables and auth settings
- **Vercel Logs**: Check deployment and runtime logs
- **Health Endpoint**: `/api/health` for system status

## 🚢 Deployment

The app is deployed on Vercel at [v0-spring-wellness-app.vercel.app](https://v0-spring-wellness-app.vercel.app).

### Deployment Process

1. Push changes to the main branch
2. Vercel automatically builds and deploys the app
3. Check Vercel dashboard for build and deployment status

### Environment Variables

Ensure the following environment variables are set in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_VERSION`
- `NEXT_PUBLIC_ERROR_ENDPOINT`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request

## 📝 License

This project is proprietary and confidential.

## 📞 Contact

For support or questions, please contact the development team.
