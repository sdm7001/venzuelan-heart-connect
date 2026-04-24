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
          id: string
          risk_score: number
          trust_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completeness?: number
          id?: string
          risk_score?: number
          trust_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completeness?: number
          id?: string
          risk_score?: number
          trust_score?: number
          updated_at?: string
          user_id?: string
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
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          evidence_url: string | null
          id: string
          resolved_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["verification_status"]
          submitted_at: string | null
          type: Database["public"]["Enums"]["verification_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          evidence_url?: string | null
          id?: string
          resolved_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_at?: string | null
          type: Database["public"]["Enums"]["verification_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          evidence_url?: string | null
          id?: string
          resolved_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_at?: string | null
          type?: Database["public"]["Enums"]["verification_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
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
      language_code: "en" | "es"
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
      subscription_tier:
        | "level_1"
        | "level_2"
        | "premium"
        | "concierge_verified"
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
      language_code: ["en", "es"],
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
      ],
      subscription_tier: [
        "level_1",
        "level_2",
        "premium",
        "concierge_verified",
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
