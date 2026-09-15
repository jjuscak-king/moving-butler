import type {
  AccessType,
  Borough,
  HomeSize,
  MemberRole,
  ServiceMode,
  StageKey,
  StageStatus,
  TaskStatus,
} from "@/lib/constants";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          reminders_enabled: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          reminders_enabled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          reminders_enabled?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      moves: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          from_address: string;
          to_address: string;
          from_borough: Borough;
          to_borough: Borough;
          window_start: string;
          window_end: string;
          home_size: HomeSize;
          access_from: AccessType;
          access_to: AccessType;
          coi_required: boolean;
          service_mode: ServiceMode;
          budget_notes: string | null;
          building_notes: string | null;
          key_contacts: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          from_address: string;
          to_address: string;
          from_borough: Borough;
          to_borough: Borough;
          window_start: string;
          window_end: string;
          home_size: HomeSize;
          access_from: AccessType;
          access_to: AccessType;
          coi_required?: boolean;
          service_mode: ServiceMode;
          budget_notes?: string | null;
          building_notes?: string | null;
          key_contacts?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          from_address?: string;
          to_address?: string;
          from_borough?: Borough;
          to_borough?: Borough;
          window_start?: string;
          window_end?: string;
          home_size?: HomeSize;
          access_from?: AccessType;
          access_to?: AccessType;
          coi_required?: boolean;
          service_mode?: ServiceMode;
          budget_notes?: string | null;
          building_notes?: string | null;
          key_contacts?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      move_stages: {
        Row: {
          id: string;
          move_id: string;
          stage_key: StageKey;
          status: StageStatus;
          sort_order: number;
        };
        Insert: {
          id?: string;
          move_id: string;
          stage_key: StageKey;
          status?: StageStatus;
          sort_order: number;
        };
        Update: {
          id?: string;
          move_id?: string;
          stage_key?: StageKey;
          status?: StageStatus;
          sort_order?: number;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          move_id: string;
          stage_key: StageKey;
          title: string;
          status: TaskStatus;
          notes: string | null;
          sort_order: number;
          is_optional: boolean;
          due_date: string | null;
          depends_on_task_id: string | null;
          claimed_by: string | null;
          reminder_sent_on: string | null;
          pack_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          move_id: string;
          stage_key: StageKey;
          title: string;
          status?: TaskStatus;
          notes?: string | null;
          sort_order?: number;
          is_optional?: boolean;
          due_date?: string | null;
          depends_on_task_id?: string | null;
          claimed_by?: string | null;
          reminder_sent_on?: string | null;
          pack_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          move_id?: string;
          stage_key?: StageKey;
          title?: string;
          status?: TaskStatus;
          notes?: string | null;
          sort_order?: number;
          is_optional?: boolean;
          due_date?: string | null;
          depends_on_task_id?: string | null;
          claimed_by?: string | null;
          reminder_sent_on?: string | null;
          pack_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      move_members: {
        Row: {
          id: string;
          move_id: string;
          user_id: string;
          role: MemberRole;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          move_id: string;
          user_id: string;
          role?: MemberRole;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          move_id?: string;
          user_id?: string;
          role?: MemberRole;
          email?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      move_issues: {
        Row: {
          id: string;
          move_id: string;
          kind: string;
          details: string | null;
          next_steps: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          move_id: string;
          kind: string;
          details?: string | null;
          next_steps: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          move_id?: string;
          kind?: string;
          details?: string | null;
          next_steps?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      move_invites: {
        Row: {
          id: string;
          move_id: string;
          token: string;
          created_by: string;
          created_at: string;
          expires_at: string;
          revoked_at: string | null;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          move_id: string;
          token?: string;
          created_by: string;
          created_at?: string;
          expires_at?: string;
          revoked_at?: string | null;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          move_id?: string;
          token?: string;
          created_by?: string;
          created_at?: string;
          expires_at?: string;
          revoked_at?: string | null;
          accepted_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_move_owner: {
        Args: { p_move_id: string };
        Returns: boolean;
      };
      is_move_member: {
        Args: { p_move_id: string };
        Returns: boolean;
      };
      get_move_invite: {
        Args: { p_token: string };
        Returns: {
          move_id: string;
          move_label: string;
          expires_at: string;
          revoked: boolean;
          already_member: boolean;
          is_owner: boolean;
        }[];
      };
      accept_move_invite: {
        Args: { p_token: string };
        Returns: string;
      };
    };
    Enums: {
      borough: Borough;
      home_size: HomeSize;
      access_type: AccessType;
      service_mode: ServiceMode;
      stage_key: StageKey;
      stage_status: StageStatus;
      task_status: TaskStatus;
      move_member_role: MemberRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type MoveRow = Database["public"]["Tables"]["moves"]["Row"];
export type MoveStageRow = Database["public"]["Tables"]["move_stages"]["Row"];
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type MoveMemberRow = Database["public"]["Tables"]["move_members"]["Row"];
export type MoveInviteRow = Database["public"]["Tables"]["move_invites"]["Row"];
export type MoveIssueRow = Database["public"]["Tables"]["move_issues"]["Row"];
export type MoveInvitePreview = Database["public"]["Functions"]["get_move_invite"]["Returns"][number];
