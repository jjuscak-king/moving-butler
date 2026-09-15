export const ISSUE_KINDS = [
  "crew_late",
  "building_access",
  "parking_dock",
  "super_unreachable",
  "damage",
  "payment",
  "other",
] as const;

export type IssueKind = (typeof ISSUE_KINDS)[number];

export const ISSUE_KIND_LABELS: Record<IssueKind, string> = {
  crew_late: "Crew is late or no-show",
  building_access: "Building will not let us in",
  parking_dock: "Truck cannot park or dock is blocked",
  super_unreachable: "Super or management not answering",
  damage: "Something was damaged",
  payment: "Payment or cash issue",
  other: "Something else",
};

export const ISSUE_NEXT_STEPS: Record<IssueKind, string> = {
  crew_late:
    "Call the crew lead, then the company dispatch number. Give the building’s loading window and say whether the elevator reservation is still valid. If they are more than 45 minutes out, tell the lobby/super you may need a later pad time. Do not leave the truck’s reservation slot unexplained — one person stays at the building.",
  building_access:
    "Ask the lobby or desk for the super or management office. Confirm COI is on file and the elevator/dock reservation time. If they need paperwork, share the Case File building notes and the mover’s COI contact. Do not leave a truck idling in a bus stop or hydrant — circle or stage legally while one person stays with the building.",
  parking_dock:
    "Check hydrants, bus stops, and posted no-standing. If you have a DOT temporary restriction, show it. Otherwise ask the super whether the freight dock can take the truck, or legally stage around the corner. One person stays with the vehicle; do not double-park in a moving lane hoping it will be fine.",
  super_unreachable:
    "Call the management office and the number in building notes. Try the lobby desk, porters, and the buzzer list. If the building requires an escort for the elevator, wait in a legal spot and text household members to keep calling. Log the times you called — management often asks later.",
  damage:
    "Photograph the item, the doorway/elevator, and the surrounding area before anything is moved again. Tell the crew lead you are documenting it. Do not sign a blank completion ticket. Note what happened in this issue log while it is fresh; insurance and valuation follow-up happens after the truck leaves.",
  payment:
    "Confirm the agreed method (cash, Zelle, card) and the amount including tip, stairs, and long-carry extras. NYC buildings rarely let a truck wait while you sort payment. If a card reader fails, use the backup method you noted in budget notes. Do not argue in the freight elevator — step aside with the crew lead.",
  other:
    "Write what happened, who is involved, and what the building or crew is asking for. Call the super/management and the crew lead. Keep one person at the building and one with the truck. Add photos or confirmation numbers in the details when you can.",
};

export const MOVE_DAY_PAYMENT_REMINDER =
  "Confirm how you will pay the crew before they leave — cash, Zelle, or card. NYC buildings rarely let a truck wait while you sort it out. Include tip and any stairs / long-carry extras you already agreed.";

export function isIssueKind(value: string | null | undefined): value is IssueKind {
  return !!value && ISSUE_KINDS.includes(value as IssueKind);
}

export function suggestedNextSteps(kind: IssueKind): string {
  return ISSUE_NEXT_STEPS[kind];
}

const PHONE_RE = /(\+?1[\s.-]?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/;

export function contactDisplayLines(text: string | null | undefined): {
  line: string;
  tel: string | null;
}[] {
  if (!text?.trim()) return [];
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(PHONE_RE);
      if (!match) return { line, tel: null };
      const digits = match[0].replace(/\D/g, "");
      const normalized = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
      if (normalized.length !== 10) return { line, tel: null };
      return { line, tel: `tel:+1${normalized}` };
    });
}
