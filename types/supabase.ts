export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string
          name: string
          emoji: string
          points: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          emoji: string
          points: number
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          emoji?: string
          points?: number
          description?: string | null
          created_at?: string
        }
      }
      daily_logs: {
        Row: {
          id: string
          user_id: string
          activity_id: string
          completed_at: string
          log_date: string
          points: number
        }
        Insert: {
          id?: string
          user_id: string
          activity_id: string
          completed_at?: string
          log_date?: string
          points: number
        }
        Update: {
          id?: string
          user_id?: string
          activity_id?: string
          completed_at?: string
          log_date?: string
          points?: number
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          banner_url: string | null
          total_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          banner_url?: string | null
          total_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          banner_url?: string | null
          total_points?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          achievement_description: string
          points_awarded: number
          achieved_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type: string
          achievement_description: string
          points_awarded?: number
          achieved_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_type?: string
          achievement_description?: string
          points_awarded?: number
          achieved_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          total_points: number
          current_tier: number
          current_streak: number
          team_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          avatar_url?: string | null
          total_points?: number
          current_tier?: number
          current_streak?: number
          team_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          total_points?: number
          current_tier?: number
          current_streak?: number
          team_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wellness_wednesday: {
        Row: {
          id: string
          team_id: string
          date: string
          bonus_achieved: boolean
          bonus_points: number
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          date: string
          bonus_achieved?: boolean
          bonus_points?: number
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          date?: string
          bonus_achieved?: boolean
          bonus_points?: number
          created_at?: string
        }
      }
      team_achievements: {
        Row: {
          id: string
          team_id: string
          achievement_type: string
          achievement_description: string
          points_awarded: number
          achieved_at: string
        }
        Insert: {
          id?: string
          team_id: string
          achievement_type: string
          achievement_description: string
          points_awarded?: number
          achieved_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          achievement_type?: string
          achievement_description?: string
          points_awarded?: number
          achieved_at?: string
        }
      }
    }
  }
}
