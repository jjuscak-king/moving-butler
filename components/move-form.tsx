"use client";

import { useActionState } from "react";
import Link from "next/link";

import { createMove, updateMove } from "@/app/actions/moves";
import { Field, NativeSelect } from "@/components/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ACCESS_LABELS,
  ACCESS_TYPES,
  BOROUGH_LABELS,
  BOROUGHS,
  CASE_FILE_LABEL_SHORT,
  HOME_SIZE_LABELS,
  HOME_SIZES,
  SERVICE_MODE_LABELS,
  SERVICE_MODES,
} from "@/lib/constants";
import type { MoveRow } from "@/lib/database.types";
import type { ActionState } from "@/lib/move-form";

const initial: ActionState = { error: null };

export function MoveForm({ move }: { move?: MoveRow }) {
  const action = move
    ? updateMove.bind(null, move.id)
    : createMove;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="grid gap-5">
      <Field
        label="Label"
        htmlFor="label"
        error={state.fieldErrors?.label?.[0]}
        hint="A short name you’ll recognize in the list."
      >
        <Input
          id="label"
          name="label"
          required
          className="h-11"
          defaultValue={move?.label}
          placeholder="Park Slope → UWS"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="From address"
          htmlFor="from_address"
          error={state.fieldErrors?.from_address?.[0]}
        >
          <Input
            id="from_address"
            name="from_address"
            required
            className="h-11"
            defaultValue={move?.from_address}
            placeholder="123 7th Ave, Brooklyn"
          />
        </Field>
        <Field
          label="To address"
          htmlFor="to_address"
          error={state.fieldErrors?.to_address?.[0]}
        >
          <Input
            id="to_address"
            name="to_address"
            required
            className="h-11"
            defaultValue={move?.to_address}
            placeholder="456 Columbus Ave, Manhattan"
          />
        </Field>
        <Field
          label="From borough"
          htmlFor="from_borough"
          error={state.fieldErrors?.from_borough?.[0]}
        >
          <NativeSelect
            id="from_borough"
            name="from_borough"
            required
            defaultValue={move?.from_borough ?? ""}
          >
            <option value="" disabled>
              Select borough
            </option>
            {BOROUGHS.map((value) => (
              <option key={value} value={value}>
                {BOROUGH_LABELS[value]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field
          label="To borough"
          htmlFor="to_borough"
          error={state.fieldErrors?.to_borough?.[0]}
        >
          <NativeSelect
            id="to_borough"
            name="to_borough"
            required
            defaultValue={move?.to_borough ?? ""}
          >
            <option value="" disabled>
              Select borough
            </option>
            {BOROUGHS.map((value) => (
              <option key={value} value={value}>
                {BOROUGH_LABELS[value]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field
          label="Window start"
          htmlFor="window_start"
          error={state.fieldErrors?.window_start?.[0]}
        >
          <Input
            id="window_start"
            name="window_start"
            type="date"
            required
            className="h-11"
            defaultValue={move?.window_start}
          />
        </Field>
        <Field
          label="Window end"
          htmlFor="window_end"
          hint="Must be on or after start."
          error={state.fieldErrors?.window_end?.[0]}
        >
          <Input
            id="window_end"
            name="window_end"
            type="date"
            required
            className="h-11"
            defaultValue={move?.window_end}
          />
        </Field>
        <Field
          label="Home size"
          htmlFor="home_size"
          error={state.fieldErrors?.home_size?.[0]}
        >
          <NativeSelect
            id="home_size"
            name="home_size"
            required
            defaultValue={move?.home_size ?? ""}
          >
            <option value="" disabled>
              Select size
            </option>
            {HOME_SIZES.map((value) => (
              <option key={value} value={value}>
                {HOME_SIZE_LABELS[value]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field
          label="DIY vs full-service"
          htmlFor="service_mode"
          error={state.fieldErrors?.service_mode?.[0]}
        >
          <NativeSelect
            id="service_mode"
            name="service_mode"
            required
            defaultValue={move?.service_mode ?? ""}
          >
            <option value="" disabled>
              Select mode
            </option>
            {SERVICE_MODES.map((value) => (
              <option key={value} value={value}>
                {SERVICE_MODE_LABELS[value]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field
          label="Access from"
          htmlFor="access_from"
          error={state.fieldErrors?.access_from?.[0]}
        >
          <NativeSelect
            id="access_from"
            name="access_from"
            required
            defaultValue={move?.access_from ?? ""}
          >
            <option value="" disabled>
              Select access
            </option>
            {ACCESS_TYPES.map((value) => (
              <option key={value} value={value}>
                {ACCESS_LABELS[value]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field
          label="Access to"
          htmlFor="access_to"
          error={state.fieldErrors?.access_to?.[0]}
        >
          <NativeSelect
            id="access_to"
            name="access_to"
            required
            defaultValue={move?.access_to ?? ""}
          >
            <option value="" disabled>
              Select access
            </option>
            {ACCESS_TYPES.map((value) => (
              <option key={value} value={value}>
                {ACCESS_LABELS[value]}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-3 text-sm">
        <input
          type="checkbox"
          name="coi_required"
          defaultChecked={move?.coi_required}
          className="mt-0.5 size-4 accent-primary"
        />
        <span>
          <span className="font-medium">COI required</span>
          <span className="mt-0.5 block text-muted-foreground">
            Many NYC buildings need a Certificate of Insurance from movers. Admin
            still seeds the COI task if this is off.
          </span>
        </span>
      </label>

      <Field
        label="Budget notes (optional)"
        htmlFor="budget_notes"
        error={state.fieldErrors?.budget_notes?.[0]}
      >
        <Textarea
          id="budget_notes"
          name="budget_notes"
          defaultValue={move?.budget_notes ?? ""}
          placeholder="Crew budget, packing help, deposits…"
        />
      </Field>
      <Field
        label="Building notes (optional)"
        htmlFor="building_notes"
        error={state.fieldErrors?.building_notes?.[0]}
      >
        <Textarea
          id="building_notes"
          name="building_notes"
          defaultValue={move?.building_notes ?? ""}
          placeholder="Super name, freight hours, walk-up flights, COI email…"
        />
      </Field>

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          nativeButton={false}
          variant="outline"
          className="h-11"
          render={<Link href={move ? `/moves/${move.id}` : "/"} />}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending} className="h-11">
          {pending ? "Saving…" : move ? `Save ${CASE_FILE_LABEL_SHORT}` : `Create ${CASE_FILE_LABEL_SHORT}`}
        </Button>
      </div>
    </form>
  );
}
