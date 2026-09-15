import { z } from "zod";

import {
  ACCESS_TYPES,
  BOROUGHS,
  HOME_SIZES,
  SERVICE_MODES,
} from "@/lib/constants";

export const moveFormSchema = z
  .object({
    label: z.string().trim().min(1, "Label is required."),
    from_address: z.string().trim().min(1, "From address is required."),
    to_address: z.string().trim().min(1, "To address is required."),
    from_borough: z.enum(BOROUGHS, { message: "Choose a from borough." }),
    to_borough: z.enum(BOROUGHS, { message: "Choose a to borough." }),
    window_start: z.string().min(1, "Window start is required."),
    window_end: z.string().min(1, "Window end is required."),
    home_size: z.enum(HOME_SIZES, { message: "Choose a home size." }),
    access_from: z.enum(ACCESS_TYPES, { message: "Choose from access." }),
    access_to: z.enum(ACCESS_TYPES, { message: "Choose to access." }),
    coi_required: z.boolean(),
    service_mode: z.enum(SERVICE_MODES, { message: "Choose DIY vs full-service." }),
    budget_notes: z.string().trim().optional(),
    building_notes: z.string().trim().optional(),
    mgmt_name: z.string().trim().optional(),
    mgmt_phone: z.string().trim().optional(),
    elevator_window_notes: z.string().trim().optional(),
    loading_dock_notes: z.string().trim().optional(),
    coi_status_notes: z.string().trim().optional(),
  })
  .refine((value) => value.window_end >= value.window_start, {
    message: "Move date window end must be on or after start.",
    path: ["window_end"],
  });

export type MoveFormValues = z.infer<typeof moveFormSchema>;

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function parseMoveForm(formData: FormData) {
  return moveFormSchema.safeParse({
    label: readString(formData, "label"),
    from_address: readString(formData, "from_address"),
    to_address: readString(formData, "to_address"),
    from_borough: readString(formData, "from_borough"),
    to_borough: readString(formData, "to_borough"),
    window_start: readString(formData, "window_start"),
    window_end: readString(formData, "window_end"),
    home_size: readString(formData, "home_size"),
    access_from: readString(formData, "access_from"),
    access_to: readString(formData, "access_to"),
    coi_required: formData.get("coi_required") === "on",
    service_mode: readString(formData, "service_mode"),
    budget_notes: readString(formData, "budget_notes") || undefined,
    building_notes: readString(formData, "building_notes") || undefined,
    mgmt_name: readString(formData, "mgmt_name") || undefined,
    mgmt_phone: readString(formData, "mgmt_phone") || undefined,
    elevator_window_notes: readString(formData, "elevator_window_notes") || undefined,
    loading_dock_notes: readString(formData, "loading_dock_notes") || undefined,
    coi_status_notes: readString(formData, "coi_status_notes") || undefined,
  });
}

export type ActionState = {
  error: string | null;
  fieldErrors?: Record<string, string[] | undefined>;
};
