// UNIBEN-only platform, so every "today" and every schedule is Lagos time.
export const APP_TIME_ZONE = "Africa/Lagos";

export function lagosHour(date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: APP_TIME_ZONE }).format(date),
  );
}

/** yyyy-mm-dd for the given instant, in Lagos. */
export function lagosDate(date = new Date()): string {
  // en-CA formats as yyyy-mm-dd
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(date);
}
