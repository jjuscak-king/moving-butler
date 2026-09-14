import {
  PRODUCT_MOTTO,
  PRODUCT_NAME,
  PRODUCT_ROLE,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ProductIntro({
  kicker,
  compact = false,
}: {
  kicker?: string;
  compact?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
        {PRODUCT_NAME}
      </p>
      <h1
        className={cn(
          "mt-2 font-heading leading-tight",
          compact ? "text-3xl" : "text-4xl"
        )}
      >
        {PRODUCT_ROLE}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{PRODUCT_MOTTO}</p>
      {kicker ? (
        <p className="mt-4 text-base text-foreground">{kicker}</p>
      ) : null}
    </div>
  );
}
