/**
 * Ordering-hours rules for Melt N Cream (timezone: Asia/Kolkata).
 * This module is pure and shared by the browser (for messaging) and the
 * server (for the authoritative check in orders.functions.ts).
 */

export const LOCATION_TYPES = ["uniworld1", "uniworld2"] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const OPEN_MINUTE = 18 * 60; // 6:00 PM

export const LOCATIONS: Record<
  LocationType,
  { label: string; closeMinute: number; deliveryFeePaise: number; closeLabel: string }
> = {
  uniworld1: {
    label: "Uniworld 1",
    closeMinute: 22 * 60,
    deliveryFeePaise: 1100,
    closeLabel: "10 PM",
  },
  uniworld2: {
    label: "Uniworld 2",
    closeMinute: 23 * 60,
    deliveryFeePaise: 0,
    closeLabel: "11 PM",
  },
};

export function isLocationType(value: unknown): value is LocationType {
  return typeof value === "string" && (LOCATION_TYPES as readonly string[]).includes(value);
}

/** Minutes since midnight in Asia/Kolkata for the given instant. */
export function istMinutes(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return (hour % 24) * 60 + minute;
}

export function minutesToLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

export type OrderingStatus = {
  open: boolean;
  /** true when the whole kitchen is shut (before 6 PM or after 11 PM) */
  globallyClosed: boolean;
  message: string;
  nowMinutes: number;
};

export function orderingStatus(
  location: LocationType | null,
  now: Date = new Date(),
): OrderingStatus {
  const nowMinutes = istMinutes(now);
  const generalClose = 23 * 60;

  if (nowMinutes < OPEN_MINUTE) {
    return {
      open: false,
      globallyClosed: true,
      message: "Orders open at 6 PM.",
      nowMinutes,
    };
  }

  if (nowMinutes >= generalClose) {
    return {
      open: false,
      globallyClosed: true,
      message: "We're closed for tonight. Orders reopen tomorrow at 6 PM.",
      nowMinutes,
    };
  }

  if (!location) {
    return { open: true, globallyClosed: false, message: "", nowMinutes };
  }

  const config = LOCATIONS[location];
  if (nowMinutes >= config.closeMinute) {
    return {
      open: false,
      globallyClosed: false,
      message:
        location === "uniworld1"
          ? "Uniworld 1 orders are closed for tonight. See you tomorrow from 6 PM."
          : `${config.label} orders are closed for tonight. Orders are available again tomorrow from 6 PM.`,
      nowMinutes,
    };
  }

  return { open: true, globallyClosed: false, message: "", nowMinutes };
}

/** 15-minute fulfilment slots still available tonight for this location. */
export function availableSlots(location: LocationType, now: Date = new Date()): string[] {
  const nowMinutes = istMinutes(now);
  const close = LOCATIONS[location].closeMinute;
  const start = Math.max(OPEN_MINUTE, Math.ceil((nowMinutes + 20) / 15) * 15);
  const slots: string[] = [];
  for (let m = start; m <= close; m += 15) slots.push(minutesToLabel(m));
  return slots;
}

export function isSlotValid(
  location: LocationType,
  slot: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!slot) return true; // "as soon as possible"
  return availableSlots(location, now).includes(slot);
}
