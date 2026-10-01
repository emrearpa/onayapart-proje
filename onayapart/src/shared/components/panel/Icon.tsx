type IconName =
  | "occupancy"
  | "arrival"
  | "departure"
  | "cash"
  | "card"
  | "warning"
  | "users"
  | "trendUp"
  | "trendDown"
  | "receipt"
  | "bank"
  | "wrench"
  | "message"
  | "home"
  | "calendar"
  | "door"
  | "doc"
  | "inbox"
  | "key"
  | "badge";

const paths: Record<IconName, React.ReactNode> = {
  occupancy: (
    <>
      <rect x="3" y="10" width="18" height="9" rx="1.5" />
      <path d="M3 10V7a2 2 0 0 1 2-2h4v5" />
      <path d="M9 19v-5h6v5" />
    </>
  ),
  arrival: (
    <>
      <path d="M4 12h11" />
      <path d="M11 7l5 5-5 5" />
      <path d="M19 5v14" />
    </>
  ),
  departure: (
    <>
      <path d="M20 12H9" />
      <path d="M13 7l-5 5 5 5" />
      <path d="M5 5v14" />
    </>
  ),
  cash: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 10v.01M18 14v.01" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 9.5h19" />
      <path d="M6 14.5h4" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <path d="M12 10v4" />
      <path d="M12 17.2v.01" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 19.5c0-3.2 2.9-5.5 6.5-5.5s6.5 2.3 6.5 5.5" />
      <path d="M16.5 5.2a3.2 3.2 0 0 1 0 6.1" />
      <path d="M19 14.3c2 .5 3.5 2.4 3.5 5.2" />
    </>
  ),
  trendUp: (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  trendDown: (
    <>
      <path d="M3 7l6 6 4-4 8 8" />
      <path d="M15 17h6v-6" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 2.5h12v19l-2.5-1.5L13 21.5 10.5 20 8 21.5 5.5 20 3 21.5V6a3.5 3.5 0 0 1 3-3.46" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  bank: (
    <>
      <path d="M3 10.5 12 4l9 6.5" />
      <path d="M4.5 10.5v8.5M9 10.5v8.5M15 10.5v8.5M19.5 10.5v8.5" />
      <path d="M2.5 20.5h19" />
    </>
  ),
  wrench: (
    <>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2 2.8-2.8Z" />
    </>
  ),
  message: (
    <>
      <path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20l1.1-4.1A8.4 8.4 0 1 1 21 11.5Z" />
    </>
  ),
  home: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.7V20h13V9.7" />
      <path d="M9.5 20v-6h5v6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </>
  ),
  door: (
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="1" />
      <path d="M14.5 12v.01" />
    </>
  ),
  doc: (
    <>
      <path d="M7 2.5h7l4 4v15H7Z" />
      <path d="M14 2.5V7h4" />
      <path d="M9.3 12h5.4M9.3 15.7h5.4" />
    </>
  ),
  inbox: (
    <>
      <path d="M3.5 12h4.7l1.8 2.8h4l1.8-2.8h4.7" />
      <path d="M5.3 5h13.4l2.3 7v7.5h-18V12Z" />
    </>
  ),
  key: (
    <>
      <circle cx="7.5" cy="8.5" r="3.8" />
      <path d="M10.2 11.2 19 20" />
      <path d="M15 16l2.3-2.3" />
      <path d="M17.7 18.7 20 16.4" />
    </>
  ),
  badge: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M5.5 16c.4-1.6 1.8-2.6 3.5-2.6s3.1 1 3.5 2.6" />
      <path d="M14.5 10h4M14.5 13.5h4" />
    </>
  ),
};

export default function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths[name]}
    </svg>
  );
}
