export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_resolved: boolean | null
          message: string
          resolved_at: string | null
          resolved_by: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          device_id: string
          event_type: string
          id: string
          metadata: Json | null
          page_number: number | null
          story_id: string | null
          time_spent_seconds: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          event_type: string
          id?: string
          metadata?: Json | null
          page_number?: number | null
          story_id?: string | null
          time_spent_seconds?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          page_number?: number | null
          story_id?: string | null
          time_spent_seconds?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          age: number
          avatar_description: string | null
          avatar_url: string | null
          challenges: string | null
          created_at: string
          favorite_friends: string | null
          fixed_details: string | null
          gender: string | null
          hobbies: string | null
          id: string
          name: string
          personality_traits: string | null
          photo_consent: boolean | null
          photo_url: string | null
          user_id: string
        }
        Insert: {
          age: number
          avatar_description?: string | null
          avatar_url?: string | null
          challenges?: string | null
          created_at?: string
          favorite_friends?: string | null
          fixed_details?: string | null
          gender?: string | null
          hobbies?: string | null
          id?: string
          name: string
          personality_traits?: string | null
          photo_consent?: boolean | null
          photo_url?: string | null
          user_id: string
        }
        Update: {
          age?: number
          avatar_description?: string | null
          avatar_url?: string | null
          challenges?: string | null
          created_at?: string
          favorite_friends?: string | null
          fixed_details?: string | null
          gender?: string | null
          hobbies?: string | null
          id?: string
          name?: string
          personality_traits?: string | null
          photo_consent?: boolean | null
          photo_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          id: string
          redeemed_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          redeemed_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          redeemed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          coupon_type: string
          created_at: string | null
          current_uses: number | null
          discount_percent: number | null
          expires_at: string | null
          extra_coloring_credits: number
          free_stories: number | null
          grants_global_pdf: boolean
          id: string
          is_active: boolean | null
          max_uses: number | null
        }
        Insert: {
          code: string
          coupon_type: string
          created_at?: string | null
          current_uses?: number | null
          discount_percent?: number | null
          expires_at?: string | null
          extra_coloring_credits?: number
          free_stories?: number | null
          grants_global_pdf?: boolean
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Update: {
          code?: string
          coupon_type?: string
          created_at?: string | null
          current_uses?: number | null
          discount_percent?: number | null
          expires_at?: string | null
          extra_coloring_credits?: number
          free_stories?: number | null
          grants_global_pdf?: boolean
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Relationships: []
      }
      cover_logs: {
        Row: {
          cast_character: string | null
          cover_path: string | null
          created_at: string
          duration_ms: number | null
          had_face_reference: boolean | null
          id: string
          selected_illustration_prompt: string | null
          story_context: string | null
          story_id: string
          topic_setting: string | null
        }
        Insert: {
          cast_character?: string | null
          cover_path?: string | null
          created_at?: string
          duration_ms?: number | null
          had_face_reference?: boolean | null
          id?: string
          selected_illustration_prompt?: string | null
          story_context?: string | null
          story_id: string
          topic_setting?: string | null
        }
        Update: {
          cast_character?: string | null
          cover_path?: string | null
          created_at?: string
          duration_ms?: number | null
          had_face_reference?: boolean | null
          id?: string
          selected_illustration_prompt?: string | null
          story_context?: string | null
          story_id?: string
          topic_setting?: string | null
        }
        Relationships: []
      }
      digital_books: {
        Row: {
          created_at: string
          dedication_text: string | null
          id: string
          is_public: boolean | null
          share_token: string
          story_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dedication_text?: string | null
          id?: string
          is_public?: boolean | null
          share_token?: string
          story_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dedication_text?: string | null
          id?: string
          is_public?: boolean | null
          share_token?: string
          story_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_books_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          created_at: string | null
          error_message: string
          error_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message: string
          error_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string
          error_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      illustration_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          fallback_reason: string | null
          had_face_reference: boolean | null
          id: string
          model_used: string
          page_number: number
          story_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          fallback_reason?: string | null
          had_face_reference?: boolean | null
          id?: string
          model_used: string
          page_number: number
          story_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          fallback_reason?: string | null
          had_face_reference?: boolean | null
          id?: string
          model_used?: string
          page_number?: number
          story_id?: string
        }
        Relationships: []
      }
      maintenance_signups: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      parent_notes: {
        Row: {
          created_at: string
          discussion_topics: string | null
          goals_reinforcements: string | null
          id: string
          magic_moments: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discussion_topics?: string | null
          goals_reinforcements?: string | null
          id?: string
          magic_moments?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discussion_topics?: string | null
          goals_reinforcements?: string | null
          id?: string
          magic_moments?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pdf_downloads: {
        Row: {
          downloaded_at: string | null
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          downloaded_at?: string | null
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          downloaded_at?: string | null
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: []
      }
      pdf_entitlements: {
        Row: {
          amount_paid: number
          granted_at: string
          id: string
          source: string | null
          story_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid?: number
          granted_at?: string
          id?: string
          source?: string | null
          story_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          granted_at?: string
          id?: string
          source?: string | null
          story_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pending_gifts: {
        Row: {
          child_name: string
          completed_at: string | null
          coupon_code: string | null
          created_at: string
          id: string
          package_id: string
          sender_name: string | null
          status: string
          user_id: string
        }
        Insert: {
          child_name: string
          completed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          id?: string
          package_id: string
          sender_name?: string | null
          status?: string
          user_id: string
        }
        Update: {
          child_name?: string
          completed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          id?: string
          package_id?: string
          sender_name?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      premium_stories: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          max_age: number | null
          min_age: number | null
          theme: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          max_age?: number | null
          min_age?: number | null
          theme?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          max_age?: number | null
          min_age?: number | null
          theme?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      premium_story_pages: {
        Row: {
          created_at: string
          id: string
          illustration_url: string | null
          page_number: number
          story_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          illustration_url?: string | null
          page_number: number
          story_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          illustration_url?: string | null
          page_number?: number
          story_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_story_pages_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "premium_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_changes_count: number | null
          avatar_emoji: string | null
          child_avatar_url: string | null
          child_photo_url: string | null
          coloring_credits: number | null
          commercial_abuse_flagged: boolean | null
          commercial_abuse_flagged_at: string | null
          created_at: string
          daily_edit_credits: number | null
          display_name: string | null
          editing_credits: number | null
          education_bonus_claimed: boolean
          email: string | null
          first_name: string | null
          first_purchase_bonus_given: boolean
          free_edits_remaining: number | null
          free_edits_total: number | null
          id: string
          is_subscriber: boolean
          last_edit_credits_reset: string | null
          last_name: string | null
          marketing_consent: boolean | null
          phone: string | null
          photo_consent_at: string | null
          referral_code: string | null
          share_coins: number | null
          story_credits: number | null
          terms_accepted_at: string | null
          terms_version: string | null
          updated_at: string
          user_role: string
        }
        Insert: {
          avatar_changes_count?: number | null
          avatar_emoji?: string | null
          child_avatar_url?: string | null
          child_photo_url?: string | null
          coloring_credits?: number | null
          commercial_abuse_flagged?: boolean | null
          commercial_abuse_flagged_at?: string | null
          created_at?: string
          daily_edit_credits?: number | null
          display_name?: string | null
          editing_credits?: number | null
          education_bonus_claimed?: boolean
          email?: string | null
          first_name?: string | null
          first_purchase_bonus_given?: boolean
          free_edits_remaining?: number | null
          free_edits_total?: number | null
          id: string
          is_subscriber?: boolean
          last_edit_credits_reset?: string | null
          last_name?: string | null
          marketing_consent?: boolean | null
          phone?: string | null
          photo_consent_at?: string | null
          referral_code?: string | null
          share_coins?: number | null
          story_credits?: number | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          user_role?: string
        }
        Update: {
          avatar_changes_count?: number | null
          avatar_emoji?: string | null
          child_avatar_url?: string | null
          child_photo_url?: string | null
          coloring_credits?: number | null
          commercial_abuse_flagged?: boolean | null
          commercial_abuse_flagged_at?: string | null
          created_at?: string
          daily_edit_credits?: number | null
          display_name?: string | null
          editing_credits?: number | null
          education_bonus_claimed?: boolean
          email?: string | null
          first_name?: string | null
          first_purchase_bonus_given?: boolean
          free_edits_remaining?: number | null
          free_edits_total?: number | null
          id?: string
          is_subscriber?: boolean
          last_edit_credits_reset?: string | null
          last_name?: string | null
          marketing_consent?: boolean | null
          phone?: string | null
          photo_consent_at?: string | null
          referral_code?: string | null
          share_coins?: number | null
          story_credits?: number | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          user_role?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_ils: number
          created_at: string | null
          credits_purchased: number
          id: string
          package_name: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount_ils: number
          created_at?: string | null
          credits_purchased: number
          id?: string
          package_name: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount_ils?: number
          created_at?: string | null
          credits_purchased?: number
          id?: string
          package_name?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          age_range: string
          audio_url: string | null
          child_gender: string | null
          child_id: string | null
          child_name: string
          child_photo_path: string | null
          cover_url: string | null
          created_at: string
          daily_story_date: string | null
          edit_count: number
          generation_status: string | null
          id: string
          is_daily_story: boolean | null
          is_premium: boolean | null
          language: string
          max_age: number | null
          min_age: number | null
          nikud: boolean
          page1_regen_lock_at: string | null
          page1_regen_used: boolean
          slug: string | null
          story_type: string | null
          summary: string | null
          theme: string | null
          topic: string
          user_id: string | null
        }
        Insert: {
          age_range: string
          audio_url?: string | null
          child_gender?: string | null
          child_id?: string | null
          child_name: string
          child_photo_path?: string | null
          cover_url?: string | null
          created_at?: string
          daily_story_date?: string | null
          edit_count?: number
          generation_status?: string | null
          id?: string
          is_daily_story?: boolean | null
          is_premium?: boolean | null
          language?: string
          max_age?: number | null
          min_age?: number | null
          nikud?: boolean
          page1_regen_lock_at?: string | null
          page1_regen_used?: boolean
          slug?: string | null
          story_type?: string | null
          summary?: string | null
          theme?: string | null
          topic: string
          user_id?: string | null
        }
        Update: {
          age_range?: string
          audio_url?: string | null
          child_gender?: string | null
          child_id?: string | null
          child_name?: string
          child_photo_path?: string | null
          cover_url?: string | null
          created_at?: string
          daily_story_date?: string | null
          edit_count?: number
          generation_status?: string | null
          id?: string
          is_daily_story?: boolean | null
          is_premium?: boolean | null
          language?: string
          max_age?: number | null
          min_age?: number | null
          nikud?: boolean
          page1_regen_lock_at?: string | null
          page1_regen_used?: boolean
          slug?: string | null
          story_type?: string | null
          summary?: string | null
          theme?: string | null
          topic?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      story_coloring_pages: {
        Row: {
          coloring_image_path: string
          created_at: string | null
          id: string
          illustration_url: string
          story_id: string
          user_id: string
        }
        Insert: {
          coloring_image_path: string
          created_at?: string | null
          id?: string
          illustration_url: string
          story_id: string
          user_id: string
        }
        Update: {
          coloring_image_path?: string
          created_at?: string | null
          id?: string
          illustration_url?: string
          story_id?: string
          user_id?: string
        }
        Relationships: []
      }
      story_pages: {
        Row: {
          created_at: string
          id: string
          illustration_prompt: string | null
          illustration_prompt_2: string | null
          illustration_url: string | null
          illustration_url_2: string | null
          page_number: number
          story_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          illustration_prompt?: string | null
          illustration_prompt_2?: string | null
          illustration_url?: string | null
          illustration_url_2?: string | null
          page_number: number
          story_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          illustration_prompt?: string | null
          illustration_prompt_2?: string | null
          illustration_url?: string | null
          illustration_url_2?: string | null
          page_number?: number
          story_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_pages_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_unlocks: {
        Row: {
          amount_paid: number
          created_at: string
          id: string
          paid_at: string
          story_id: string
          unlock_type: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          id?: string
          paid_at?: string
          story_id: string
          unlock_type: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          id?: string
          paid_at?: string
          story_id?: string
          unlock_type?: string
          user_id?: string
        }
        Relationships: []
      }
      topic_wishlist: {
        Row: {
          created_at: string
          id: string
          topic_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          topic_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          improvement_suggestion: string | null
          is_approved: boolean | null
          message: string | null
          page_url: string | null
          rating: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          improvement_suggestion?: string | null
          is_approved?: boolean | null
          message?: string | null
          page_url?: string | null
          rating?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          improvement_suggestion?: string | null
          is_approved?: boolean | null
          message?: string | null
          page_url?: string | null
          rating?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          age_filter_max: number | null
          age_filter_min: number | null
          avatar_emoji: string | null
          created_at: string | null
          device_id: string
          id: string
          last_active: string | null
          nickname: string | null
          screen_time_limit: number | null
          silent_mode: boolean | null
          sound_effects_enabled: boolean | null
        }
        Insert: {
          age_filter_max?: number | null
          age_filter_min?: number | null
          avatar_emoji?: string | null
          created_at?: string | null
          device_id: string
          id?: string
          last_active?: string | null
          nickname?: string | null
          screen_time_limit?: number | null
          silent_mode?: boolean | null
          sound_effects_enabled?: boolean | null
        }
        Update: {
          age_filter_max?: number | null
          age_filter_min?: number | null
          avatar_emoji?: string | null
          created_at?: string | null
          device_id?: string
          id?: string
          last_active?: string | null
          nickname?: string | null
          screen_time_limit?: number | null
          silent_mode?: boolean | null
          sound_effects_enabled?: boolean | null
        }
        Relationships: []
      }
      user_story_stats: {
        Row: {
          id: string
          last_read: string
          read_count: number
          story_id: string
          user_id: string
        }
        Insert: {
          id?: string
          last_read?: string
          read_count?: number
          story_id: string
          user_id: string
        }
        Update: {
          id?: string
          last_read?: string
          read_count?: number
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_story_stats_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_story_slug: {
        Args: { p_child_name: string; p_topic: string }
        Returns: string
      }
      get_admin_user_emails: {
        Args: never
        Returns: {
          email: string
          user_id: string
        }[]
      }
      get_public_book: {
        Args: { p_share_token: string }
        Returns: {
          created_at: string
          id: string
          is_public: boolean
          share_token: string
          story_id: string
          updated_at: string
        }[]
      }
      get_public_story: { Args: { p_story_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      redeem_coupon_atomic: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
