export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: "home" | "log" | "timer" | "chart" | "user" | "arrow" | "plus";
  className?: string;
}) {
  const paths = {
    home: <path d="M3 10.5 12 3l9 7.5M5.5 9v11h13V9M9 20v-6h6v6" />,
    log: <path d="M6 3.5h12v17H6zM9 8h6M9 12h6M9 16h4" />,
    timer: <path d="M9 2h6M12 7v5l3 2M12 22a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />,
    chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
    user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 21a7.5 7.5 0 0 1 15 0" />,
    arrow: <path d="m9 18 6-6-6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {paths[name]}
    </svg>
  );
}
