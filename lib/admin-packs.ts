import type { StageKey } from "@/lib/constants";

export const ADMIN_PACK_KEYS = [
  "building",
  "change_of_address",
  "utilities",
  "internet",
  "insurance",
] as const;

export type AdminPackKey = (typeof ADMIN_PACK_KEYS)[number];

export type AdminPackLink = {
  label: string;
  href: string;
};

export type AdminPackMeta = {
  key: AdminPackKey;
  label: string;
  blurb: string;
  links: AdminPackLink[];
  titles: readonly string[];
};

export const ADMIN_PACKS: readonly AdminPackMeta[] = [
  {
    key: "building",
    label: "Building & management",
    blurb: "COI, freight elevator, dock, parking, and who to call at the building.",
    links: [
      {
        label: "NYC DOT parking rules",
        href: "https://www.nyc.gov/html/dot/html/motorist/parkreg.shtml",
      },
    ],
    titles: [
      "Request COI if needed",
      "Book elevator / loading dock",
      "Read building move rules",
      "Loading dock reservation notes",
      "Street parking notes",
      "Walk-up logistics",
      "DOT parking permit if needed",
      "Building super / management contact",
    ],
  },
  {
    key: "change_of_address",
    label: "Change of address",
    blurb: "USPS forwarding plus the NYC accounts that do not follow mail automatically.",
    links: [
      { label: "USPS change of address", href: "https://moversguide.usps.com/" },
      { label: "NYC 311", href: "https://portal.311.nyc.gov/" },
      { label: "NY DMV address change", href: "https://dmv.ny.gov/address-change" },
    ],
    titles: [
      "Start change-of-address list",
      "USPS COA",
      "NYC.gov / 311 address",
      "Banks, payroll, and subscriptions",
      "NY DMV / ID address",
    ],
  },
  {
    key: "utilities",
    label: "Utilities",
    blurb: "Overlap power, gas, and water so night one is not dark or cold.",
    links: [
      {
        label: "Con Edison start/stop",
        href: "https://www.coned.com/en/accounts-billing/start-stop-move",
      },
      {
        label: "National Grid NY move",
        href: "https://www.nationalgridus.com/NY-Home/Help/Moving-or-Closing-an-Account",
      },
      {
        label: "NYC DEP water/sewer",
        href: "https://www.nyc.gov/site/dep/pay-my-bills/start-stop-service.page",
      },
    ],
    titles: [
      "Utilities shutoff/start list",
      "Con Edison",
      "National Grid gas if applicable",
      "NYC DEP water/sewer",
    ],
  },
  {
    key: "internet",
    label: "Internet",
    blurb: "NYC install slots book out. Confirm the tech can access the apartment and riser.",
    links: [
      { label: "Spectrum move", href: "https://www.spectrum.com/move" },
      { label: "Verizon Fios moving", href: "https://www.verizon.com/home/moving/" },
      { label: "Optimum support", href: "https://www.optimum.com/support" },
    ],
    titles: ["Internet transfer", "Confirm internet install window"],
  },
  {
    key: "insurance",
    label: "Insurance",
    blurb: "Renters coverage at the new address and mover valuation — not a marketplace.",
    links: [],
    titles: [
      "Renters insurance at destination",
      "Confirm mover valuation / insurance",
    ],
  },
] as const;

export const WEEK3_ADMIN_TITLES = [
  "NYC.gov / 311 address",
  "Banks, payroll, and subscriptions",
  "NY DMV / ID address",
  "National Grid gas if applicable",
  "NYC DEP water/sewer",
  "Confirm internet install window",
  "Renters insurance at destination",
  "Confirm mover valuation / insurance",
] as const;

const TITLE_TO_PACK: Record<string, AdminPackKey> = Object.fromEntries(
  ADMIN_PACKS.flatMap((pack) => pack.titles.map((title) => [title, pack.key]))
) as Record<string, AdminPackKey>;

export function isAdminPackKey(value: string | null | undefined): value is AdminPackKey {
  return !!value && ADMIN_PACK_KEYS.includes(value as AdminPackKey);
}

export function packKeyForTask(task: {
  pack_key?: string | null;
  title: string;
  stage_key?: StageKey;
}): AdminPackKey | null {
  if (isAdminPackKey(task.pack_key)) return task.pack_key;
  return TITLE_TO_PACK[task.title] ?? null;
}

export function packProgress(
  tasks: readonly { status: string }[]
): { done: number; blocked: number; total: number } {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  return { done, blocked, total };
}
