import type {
  AccessType,
  Borough,
  HomeSize,
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
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
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
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      borough: Borough;
      home_size: HomeSize;
      access_type: AccessType;
      service_mode: ServiceMode;
      stage_key: StageKey;
      stage_status: StageStatus;
      task_status: TaskStatus;
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
