/** Brand name. Pair with PRODUCT_ROLE so the first screen is not read as a moving company. */
export const PRODUCT_NAME = "Moving Butler";
/** Frozen product language — not “AI moving assistant”. */
export const PRODUCT_ROLE = "AI Relocation Manager";
export const PRODUCT_MOTTO =
  "Software that orchestrates a relocation — not a moving or trucking company.";
/** System noun for a move (routes stay `/moves`). Casual UI may still say “move”. */
export const CASE_FILE_LABEL = "Relocation Case File";
export const CASE_FILE_LABEL_SHORT = "Case File";

export const STAGE_KEYS = [
  "decide",
  "plan",
  "vendors",
  "admin",
  "move_day",
  "settle",
] as const;

export type StageKey = (typeof STAGE_KEYS)[number];

export const STAGE_META: Record<
  StageKey,
  { number: number; label: string; blurb: string }
> = {
  decide: {
    number: 1,
    label: "Decide",
    blurb: "Lock the window, service mode, and size of the move.",
  },
  plan: {
    number: 2,
    label: "Plan",
    blurb: "Packing order, supplies, and household alignment.",
  },
  vendors: {
    number: 3,
    label: "Vendors",
    blurb: "Track who you booked. Week 1 is not a marketplace.",
  },
  admin: {
    number: 4,
    label: "Admin",
    blurb: "NYC building, COI, utilities, and change-of-address work.",
  },
  move_day: {
    number: 5,
    label: "Move day",
    blurb: "Crew time, access notes, and building protection.",
  },
  settle: {
    number: 6,
    label: "Settle",
    blurb: "Unpack, utilities, and a 7-day sweep.",
  },
};

export const STAGE_STATUSES = [
  "not_started",
  "in_progress",
  "blocked",
  "done",
] as const;

export type StageStatus = (typeof STAGE_STATUSES)[number];

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "blocked",
  "done",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export const BOROUGHS = [
  "manhattan",
  "brooklyn",
  "queens",
  "bronx",
  "staten_island",
  "other_nyc_metro",
  "outside_nyc_metro",
] as const;

export type Borough = (typeof BOROUGHS)[number];

export const BOROUGH_LABELS: Record<Borough, string> = {
  manhattan: "Manhattan",
  brooklyn: "Brooklyn",
  queens: "Queens",
  bronx: "Bronx",
  staten_island: "Staten Island",
  other_nyc_metro: "Other NYC metro",
  outside_nyc_metro: "Outside NYC metro",
};

export const HOME_SIZES = [
  "studio",
  "one_br",
  "two_br",
  "three_br_plus",
  "house",
  "storage_only",
] as const;

export type HomeSize = (typeof HOME_SIZES)[number];

export const HOME_SIZE_LABELS: Record<HomeSize, string> = {
  studio: "Studio",
  one_br: "1BR",
  two_br: "2BR",
  three_br_plus: "3BR+",
  house: "House",
  storage_only: "Storage-only/Other",
};

export const ACCESS_TYPES = ["elevator", "walk_up", "mixed"] as const;

export type AccessType = (typeof ACCESS_TYPES)[number];

export const ACCESS_LABELS: Record<AccessType, string> = {
  elevator: "Elevator",
  walk_up: "Walk-up",
  mixed: "Mixed/unknown",
};

export const SERVICE_MODES = ["diy", "hybrid", "full_service", "unsure"] as const;

export type ServiceMode = (typeof SERVICE_MODES)[number];

export const SERVICE_MODE_LABELS: Record<ServiceMode, string> = {
  diy: "DIY",
  hybrid: "Hybrid",
  full_service: "Full-service",
  unsure: "Unsure",
};

/** Minimum Week 1 titles that must appear in the SQL seed. */
export const MINIMUM_SEED_TITLES = [
  "Confirm move date window",
  "Confirm DIY vs full-service",
  "Rough inventory / size check",
  "Create room pack order",
  "Order packing supplies",
  "Share plan with household",
  "Book movers",
  "Book packing help if needed",
  "Reserve truck/parking if DIY",
  "Request COI if needed",
  "Book elevator / loading dock",
  "Start change-of-address list",
  "Utilities shutoff/start list",
  "Internet transfer",
  "Confirm crew time",
  "Prep building access notes",
  "Protect floors / elevators notes",
  "Unpack priorities",
  "Confirm utilities live",
  "7-day open-task sweep",
] as const;

/** NYC constraint pack titles that must stay in the seed. */
export const NYC_CONSTRAINT_TITLES = [
  "Request COI if needed",
  "Book elevator / loading dock",
  "Loading dock reservation notes",
  "Street parking notes",
] as const;

export const MOVE_DAY_COI_DEPENDENTS = [
  "Confirm crew time",
  "Prep building access notes",
  "Protect floors / elevators notes",
] as const;

export const MEMBER_ROLES = ["owner", "member"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Owner",
  member: "Co-mover",
};
