import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { orderingStatus, type LocationType } from "@/lib/hours";

/**
 * Live open/closed message. Purely informational — the server re-checks the
 * same rules before any order or payment is created.
 */
export function useOrderingStatus(location: LocationType | null) {
  const [status, setStatus] = useState(() => orderingStatus(location));

  useEffect(() => {
    setStatus(orderingStatus(location));
    const timer = setInterval(() => setStatus(orderingStatus(location)), 30_000);
    return () => clearInterval(timer);
  }, [location]);

  return status;
}

export function HoursNotice({ location }: { location: LocationType | null }) {
  const status = useOrderingStatus(location);
  if (status.open) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-secondary/60 p-4 text-sm">
      <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
      <p>{status.message} You can still pre-order for the next opening.</p>
    </div>
  );
}
