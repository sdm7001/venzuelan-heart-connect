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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      app_settings_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          key: string
          value: Json
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          key: string
          value: Json
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          key?: string
          value?: Json
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          category: string
          created_at: string
          id: string
          metadata: Json | null
          subject_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          category: string
          created_at?: string
          id?: string
          metadata?: Json | null
          subject_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          category?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          subject_id?: string | null
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          amount_cents: number | null
          created_at: string
          currency: string | null
          event_type: Database["public"]["Enums"]["billing_event_type"]
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          event_type: Database["public"]["Enums"]["billing_event_type"]
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          event_type?: Database["public"]["Enums"]["billing_event_type"]
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_user_id: string
          created_at: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          body_en: string
          body_es: string
          category: string
          created_at: string
          excerpt_en: string
          excerpt_es: string
          faq_en: Json
          faq_es: Json
          featured: boolean
          hero_image_url: string | null
          id: string
          internal_links_en: Json
          internal_links_es: Json
          meta_description_en: string
          meta_description_es: string
          published: boolean
          published_at: string
          reading_minutes: number
          slug: string
          tags: string[]
          title_en: string
          title_es: string
          updated_at: string
        }
        Insert: {
          body_en: string
          body_es: string
          category: string
          created_at?: string
          excerpt_en: string
          excerpt_es: string
          faq_en?: Json
          faq_es?: Json
          featured?: boolean
          hero_image_url?: string | null
          id?: string
          internal_links_en?: Json
          internal_links_es?: Json
          meta_description_en: string
          meta_description_es: string
          published?: boolean
          published_at?: string
          reading_minutes?: number
          slug: string
          tags?: string[]
          title_en: string
          title_es: string
          updated_at?: string
        }
        Update: {
          body_en?: string
          body_es?: string
          category?: string
          created_at?: string
          excerpt_en?: string
          excerpt_es?: string
          faq_en?: Json
          faq_es?: Json
          featured?: boolean
          hero_image_url?: string | null
          id?: string
          internal_links_en?: Json
          internal_links_es?: Json
          meta_description_en?: string
          meta_description_es?: string
          published?: boolean
          published_at?: string
          reading_minutes?: number
          slug?: string
          tags?: string[]
          title_en?: string
          title_es?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      contact_events: {
        Row: {
          created_at: string
          environment: string
          id: string
          period_end: string | null
          period_start: string
          recipient_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          environment?: string
          id?: string
          period_end?: string | null
          period_start: string
          recipient_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          environment?: string
          id?: string
          period_end?: string | null
          period_start?: string
          recipient_id?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          created_at: string
          delta: number
          id: string
          reason: string | null
          wallet_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          reason?: string | null
          wallet_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          reason?: string | null
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "credit_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_wallets: {
        Row: {
          balance: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          favorited_user_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favorited_user_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          favorited_user_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      gift_order_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          notes: string | null
          order_id: string
          status: Database["public"]["Enums"]["gift_order_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          order_id: string
          status: Database["public"]["Enums"]["gift_order_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["gift_order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "gift_order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "gift_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_orders: {
        Row: {
          amount_cents: number | null
          created_at: string
          credit_cost: number | null
          currency: string | null
          gift_id: string
          id: string
          kind: Database["public"]["Enums"]["gift_order_kind"]
          message: string | null
          metadata: Json
          recipient_id: string
          sender_id: string
          status: Database["public"]["Enums"]["gift_order_status"]
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          credit_cost?: number | null
          currency?: string | null
          gift_id: string
          id?: string
          kind: Database["public"]["Enums"]["gift_order_kind"]
          message?: string | null
          metadata?: Json
          recipient_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["gift_order_status"]
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          credit_cost?: number | null
          currency?: string | null
          gift_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["gift_order_kind"]
          message?: string | null
          metadata?: Json
          recipient_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["gift_order_status"]
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_orders_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_orders_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          active: boolean
          code: string
          created_at: string
          credit_cost: number
          description: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          credit_cost?: number
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          credit_cost?: number
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      internal_link_suggestions: {
        Row: {
          applied_at: string | null
          created_at: string
          href: string
          id: string
          label: string
          lang: Database["public"]["Enums"]["language_code"]
          post_id: string
          reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["link_suggestion_status"]
          suggested_by: string | null
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          href: string
          id?: string
          label: string
          lang: Database["public"]["Enums"]["language_code"]
          post_id: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["link_suggestion_status"]
          suggested_by?: string | null
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          href?: string
          id?: string
          label?: string
          lang?: Database["public"]["Enums"]["language_code"]
          post_id?: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["link_suggestion_status"]
          suggested_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          sender_id: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action: Database["public"]["Enums"]["moderator_action"]
          case_id: string | null
          created_at: string
          flag_id: string | null
          id: string
          moderator_id: string
          notes: string | null
          report_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["moderator_action"]
          case_id?: string | null
          created_at?: string
          flag_id?: string | null
          id?: string
          moderator_id: string
          notes?: string | null
          report_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["moderator_action"]
          case_id?: string | null
          created_at?: string
          flag_id?: string | null
          id?: string
          moderator_id?: string
          notes?: string | null
          report_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "moderation_flags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_flags: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["flag_kind"]
          severity: Database["public"]["Enums"]["report_severity"]
          source: string | null
          status: Database["public"]["Enums"]["report_status"]
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["flag_kind"]
          severity?: Database["public"]["Enums"]["report_severity"]
          source?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["flag_kind"]
          severity?: Database["public"]["Enums"]["report_severity"]
          source?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          user_id?: string | null
        }
        Relationships: []
      }
      photos: {
        Row: {
          created_at: string
          id: string
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          photo_type: Database["public"]["Enums"]["photo_type"]
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          photo_type?: Database["public"]["Enums"]["photo_type"]
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          photo_type?: Database["public"]["Enums"]["photo_type"]
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      policy_acknowledgements: {
        Row: {
          accepted_at: string
          id: string
          policy_key: string
          policy_version: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          policy_key: string
          policy_version: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          id?: string
          policy_key?: string
          policy_version?: string
          user_id?: string
        }
        Relationships: []
      }
      policy_reminders: {
        Row: {
          channel: string
          created_at: string
          dismissed_at: string | null
          email_status: string | null
          id: string
          missing_keys: string[]
          policy_version: string
          sent_by: string
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          dismissed_at?: string | null
          email_status?: string | null
          id?: string
          missing_keys?: string[]
          policy_version: string
          sent_by: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          dismissed_at?: string | null
          email_status?: string | null
          id?: string
          missing_keys?: string[]
          policy_version?: string
          sent_by?: string
          user_id?: string
        }
        Relationships: []
      }
      private_photo_permissions: {
        Row: {
          created_at: string
          granted_to: string
          id: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          granted_to: string
          id?: string
          owner_id: string
        }
        Update: {
          created_at?: string
          granted_to?: string
          id?: string
          owner_id?: string
        }
        Relationships: []
      }
      profile_scores: {
        Row: {
          completeness: number
          concierge_verified: boolean
          id: string
          risk_score: number
          trust_badge_count: number
          trust_score: number
          updated_at: string
          user_id: string
          verified_priority_score: number
        }
        Insert: {
          completeness?: number
          concierge_verified?: boolean
          id?: string
          risk_score?: number
          trust_badge_count?: number
          trust_score?: number
          updated_at?: string
          user_id: string
          verified_priority_score?: number
        }
        Update: {
          completeness?: number
          concierge_verified?: boolean
          id?: string
          risk_score?: number
          trust_badge_count?: number
          trust_score?: number
          updated_at?: string
          user_id?: string
          verified_priority_score?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          age_confirmed: boolean
          bio: string | null
          city: string | null
          community_rules_accepted_at: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          onboarding_completed: boolean
          preferred_language: Database["public"]["Enums"]["language_code"]
          relationship_intention:
            | Database["public"]["Enums"]["relationship_intention"]
            | null
          spoken_languages: string[] | null
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          age_confirmed?: boolean
          bio?: string | null
          city?: string | null
          community_rules_accepted_at?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          id: string
          onboarding_completed?: boolean
          preferred_language?: Database["public"]["Enums"]["language_code"]
          relationship_intention?:
            | Database["public"]["Enums"]["relationship_intention"]
            | null
          spoken_languages?: string[] | null
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          age_confirmed?: boolean
          bio?: string | null
          city?: string | null
          community_rules_accepted_at?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          onboarding_completed?: boolean
          preferred_language?: Database["public"]["Enums"]["language_code"]
          relationship_intention?:
            | Database["public"]["Enums"]["relationship_intention"]
            | null
          spoken_languages?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["report_category"]
          created_at: string
          description: string | null
          id: string
          reported_user_id: string | null
          reporter_id: string
          severity: Database["public"]["Enums"]["report_severity"]
          status: Database["public"]["Enums"]["report_status"]
          target: Database["public"]["Enums"]["report_target"]
          target_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: Database["public"]["Enums"]["report_category"]
          created_at?: string
          description?: string | null
          id?: string
          reported_user_id?: string | null
          reporter_id: string
          severity?: Database["public"]["Enums"]["report_severity"]
          status?: Database["public"]["Enums"]["report_status"]
          target: Database["public"]["Enums"]["report_target"]
          target_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          description?: string | null
          id?: string
          reported_user_id?: string | null
          reporter_id?: string
          severity?: Database["public"]["Enums"]["report_severity"]
          status?: Database["public"]["Enums"]["report_status"]
          target?: Database["public"]["Enums"]["report_target"]
          target_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      risk_events: {
        Row: {
          category: string
          created_at: string
          id: string
          metadata: Json
          reviewed_at: string | null
          reviewed_by: string | null
          severity: Database["public"]["Enums"]["report_severity"]
          source: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          metadata?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: Database["public"]["Enums"]["report_severity"]
          source?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          metadata?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: Database["public"]["Enums"]["report_severity"]
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      staff_mfa_challenges: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          locked_at: string | null
          max_attempts: number
          request_ip: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          locked_at?: string | null
          max_attempts?: number
          request_ip?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          locked_at?: string | null
          max_attempts?: number
          request_ip?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      staff_recovery_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      staff_step_up: {
        Row: {
          method: string
          updated_at: string
          user_id: string
          verified_at: string
        }
        Insert: {
          method?: string
          updated_at?: string
          user_id: string
          verified_at?: string
        }
        Update: {
          method?: string
          updated_at?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string | null
          product_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string | null
          product_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string | null
          product_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      trust_badges: {
        Row: {
          awarded_at: string
          awarded_by: string | null
          id: string
          kind: Database["public"]["Enums"]["trust_badge_kind"]
          metadata: Json
          revoked_at: string | null
          revoked_reason: string | null
          source_verification_id: string | null
          user_id: string
        }
        Insert: {
          awarded_at?: string
          awarded_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["trust_badge_kind"]
          metadata?: Json
          revoked_at?: string | null
          revoked_reason?: string | null
          source_verification_id?: string | null
          user_id: string
        }
        Update: {
          awarded_at?: string
          awarded_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["trust_badge_kind"]
          metadata?: Json
          revoked_at?: string | null
          revoked_reason?: string | null
          source_verification_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_badges_source_verification_id_fkey"
            columns: ["source_verification_id"]
            isOneToOne: false
            referencedRelation: "verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_entitlements: {
        Row: {
          cancel_at_period_end: boolean
          contacts_used_this_period: number
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          is_active: boolean
          monthly_contact_limit: number | null
          source_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          tier: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          contacts_used_this_period?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          is_active?: boolean
          monthly_contact_limit?: number | null
          source_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          contacts_used_this_period?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          is_active?: boolean
          monthly_contact_limit?: number | null
          source_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_entitlements_source_subscription_id_fkey"
            columns: ["source_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          created_at: string
          documents: Json
          evidence_url: string | null
          id: string
          kind: Database["public"]["Enums"]["verification_kind"] | null
          metadata: Json
          resolved_at: string | null
          retry_of: string | null
          reviewer_decision: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["verification_status"]
          step: string | null
          submitted_at: string | null
          type: Database["public"]["Enums"]["verification_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          documents?: Json
          evidence_url?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["verification_kind"] | null
          metadata?: Json
          resolved_at?: string | null
          retry_of?: string | null
          reviewer_decision?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          step?: string | null
          submitted_at?: string | null
          type: Database["public"]["Enums"]["verification_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          documents?: Json
          evidence_url?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["verification_kind"] | null
          metadata?: Json
          resolved_at?: string | null
          retry_of?: string | null
          reviewer_decision?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          step?: string | null
          submitted_at?: string | null
          type?: Database["public"]["Enums"]["verification_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_retry_of_fkey"
            columns: ["retry_of"]
            isOneToOne: false
            referencedRelation: "verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_badge_from_verification: {
        Args: { _verification_id: string }
        Returns: string
      }
      consume_contact: {
        Args: { _env: string; _recipient_id: string }
        Returns: {
          allowed: boolean
          contacts_used: number
          monthly_limit: number
          reason: string
        }[]
      }
      consume_staff_recovery_code: {
        Args: { _code_hash: string }
        Returns: {
          codes_remaining: number
          reason: string
          verified: boolean
        }[]
      }
      count_active_staff_recovery_codes: { Args: never; Returns: number }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_staff_recovery_codes: {
        Args: { _code_hashes: string[] }
        Returns: number
      }
      has_active_badge: {
        Args: {
          _kind: Database["public"]["Enums"]["trust_badge_kind"]
          _user_id: string
        }
        Returns: boolean
      }
      has_completed_onboarding: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blocked_between: {
        Args: { _a: string; _b: string }
        Returns: {
          a_blocks_b: boolean
          b_blocks_a: boolean
        }[]
      }
      is_eligible_for_gifting: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      issue_staff_mfa_challenge: {
        Args: { _code_hash: string; _ip?: string; _user_agent?: string }
        Returns: {
          challenge_id: string
          expires_at: string
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recompute_trust_state: { Args: { _user_id: string }; Returns: undefined }
      recompute_user_entitlement: {
        Args: { _env: string; _user_id: string }
        Returns: undefined
      }
      user_trust_state: {
        Args: { _user_id: string }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          badge_count: number
          concierge_verified: boolean
          recent_severe_flags: number
        }[]
      }
      verify_staff_mfa_challenge: {
        Args: { _code_hash: string }
        Returns: {
          reason: string
          verified: boolean
        }[]
      }
    }
    Enums: {
      account_status:
        | "active"
        | "restricted"
        | "suspended"
        | "banned"
        | "pending_verification"
      app_role:
        | "female_user"
        | "male_user"
        | "moderator"
        | "admin"
        | "support"
        | "verification_reviewer"
      billing_event_type:
        | "subscription_created"
        | "subscription_renewed"
        | "subscription_canceled"
        | "credit_purchase"
        | "refund"
        | "failed_payment"
        | "subscription_upgraded"
        | "subscription_downgraded"
      flag_kind:
        | "mass_messaging"
        | "copy_paste_intro"
        | "rapid_contact"
        | "off_platform_attempt"
        | "money_request"
        | "high_report_frequency"
        | "text_moderation"
        | "image_moderation"
      gender: "female" | "male" | "other"
      gift_order_kind: "virtual" | "physical"
      gift_order_status:
        | "created"
        | "paid"
        | "blocked_by_moderation"
        | "fulfilled"
        | "refunded"
        | "canceled"
        | "failed"
      language_code: "en" | "es"
      link_suggestion_status: "pending" | "approved" | "rejected"
      moderation_status: "pending" | "approved" | "rejected" | "flagged"
      moderator_action:
        | "warn_user"
        | "remove_content"
        | "reject_photo"
        | "restrict_features"
        | "suspend_account"
        | "ban_account"
        | "add_note"
        | "escalate"
        | "close_case"
      photo_type: "primary" | "public" | "private"
      relationship_intention:
        | "marriage"
        | "serious_relationship"
        | "travel_and_meet"
        | "friendship_first"
      report_category:
        | "scam_or_fraud"
        | "impersonation"
        | "solicitation"
        | "explicit_content"
        | "harassment"
        | "underage_concern"
        | "spam"
        | "off_platform_payment_request"
        | "other"
      report_severity: "low" | "medium" | "high" | "critical"
      report_status: "new" | "in_review" | "escalated" | "actioned" | "closed"
      report_target: "profile" | "photo" | "message" | "account"
      subscription_status:
        | "inactive"
        | "active"
        | "past_due"
        | "canceled"
        | "refunded"
        | "trialing"
        | "incomplete"
      subscription_tier:
        | "level_1"
        | "level_2"
        | "premium"
        | "concierge_verified"
      trust_badge_kind:
        | "email_confirmed"
        | "photo_verified"
        | "social_verified"
        | "id_verified"
        | "income_verified"
        | "concierge_verified"
        | "profile_complete"
        | "founding_member"
      verification_kind:
        | "social_verification"
        | "photo_verification"
        | "id_verification"
        | "income_verification"
        | "concierge_verified_review"
      verification_status:
        | "not_started"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "needs_more_info"
      verification_type:
        | "social_verification"
        | "photo_verification"
        | "id_verification"
        | "income_verification"
        | "background_check_placeholder"
        | "concierge_verified_review"
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
      account_status: [
        "active",
        "restricted",
        "suspended",
        "banned",
        "pending_verification",
      ],
      app_role: [
        "female_user",
        "male_user",
        "moderator",
        "admin",
        "support",
        "verification_reviewer",
      ],
      billing_event_type: [
        "subscription_created",
        "subscription_renewed",
        "subscription_canceled",
        "credit_purchase",
        "refund",
        "failed_payment",
        "subscription_upgraded",
        "subscription_downgraded",
      ],
      flag_kind: [
        "mass_messaging",
        "copy_paste_intro",
        "rapid_contact",
        "off_platform_attempt",
        "money_request",
        "high_report_frequency",
        "text_moderation",
        "image_moderation",
      ],
      gender: ["female", "male", "other"],
      gift_order_kind: ["virtual", "physical"],
      gift_order_status: [
        "created",
        "paid",
        "blocked_by_moderation",
        "fulfilled",
        "refunded",
        "canceled",
        "failed",
      ],
      language_code: ["en", "es"],
      link_suggestion_status: ["pending", "approved", "rejected"],
      moderation_status: ["pending", "approved", "rejected", "flagged"],
      moderator_action: [
        "warn_user",
        "remove_content",
        "reject_photo",
        "restrict_features",
        "suspend_account",
        "ban_account",
        "add_note",
        "escalate",
        "close_case",
      ],
      photo_type: ["primary", "public", "private"],
      relationship_intention: [
        "marriage",
        "serious_relationship",
        "travel_and_meet",
        "friendship_first",
      ],
      report_category: [
        "scam_or_fraud",
        "impersonation",
        "solicitation",
        "explicit_content",
        "harassment",
        "underage_concern",
        "spam",
        "off_platform_payment_request",
        "other",
      ],
      report_severity: ["low", "medium", "high", "critical"],
      report_status: ["new", "in_review", "escalated", "actioned", "closed"],
      report_target: ["profile", "photo", "message", "account"],
      subscription_status: [
        "inactive",
        "active",
        "past_due",
        "canceled",
        "refunded",
        "trialing",
        "incomplete",
      ],
      subscription_tier: [
        "level_1",
        "level_2",
        "premium",
        "concierge_verified",
      ],
      trust_badge_kind: [
        "email_confirmed",
        "photo_verified",
        "social_verified",
        "id_verified",
        "income_verified",
        "concierge_verified",
        "profile_complete",
        "founding_member",
      ],
      verification_kind: [
        "social_verification",
        "photo_verification",
        "id_verification",
        "income_verification",
        "concierge_verified_review",
      ],
      verification_status: [
        "not_started",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "needs_more_info",
      ],
      verification_type: [
        "social_verification",
        "photo_verification",
        "id_verification",
        "income_verification",
        "background_check_placeholder",
        "concierge_verified_review",
      ],
    },
  },
} as const
