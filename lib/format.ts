// All events are in India, so dates are always shown in IST regardless of the viewer's device.
const TIME_ZONE = "Asia/Kolkata";

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** 15000000 paise -> "₹1,50,000"; 0 -> "Free" */
export function formatPrice(paise: number) {
  return paise === 0 ? "Free" : rupees.format(paise / 100);
}

const dateParts = new Intl.DateTimeFormat("en-IN", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** ISO date -> "Sat, 18 Oct, 6:30 PM" */
export function formatEventDate(iso: string | Date) {
  const parts = Object.fromEntries(
    dateParts.formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
  );
  // Newer Intl versions write September as "Sept"; keep every month at 3 letters ("Sep", "Oct")
  const month = parts.month.slice(0, 3);
  return `${parts.weekday}, ${parts.day} ${month}, ${parts.hour}:${parts.minute} ${parts.dayPeriod.toUpperCase()}`;
}
