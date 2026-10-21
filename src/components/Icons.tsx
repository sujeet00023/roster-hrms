type P = { className?: string };

function Svg({ className = "h-5 w-5", children }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: P) => (
  <Svg {...p}>
    <path d="M4 11.5 12 5l8 6.5" />
    <path d="M6.5 10.5V19h11v-8.5" />
  </Svg>
);
export const IconClock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);
export const IconCalendar = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="4.5" width="17" height="16" rx="3" />
    <path d="M3.5 9.5h17M8 3v3M16 3v3" />
  </Svg>
);
export const IconWallet = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="6" width="17" height="13" rx="3" />
    <path d="M3.5 10h17" />
    <circle cx="16.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
  </Svg>
);
export const IconUser = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M4.5 20c1.4-4 4.2-6 7.5-6s6.1 2 7.5 6" />
  </Svg>
);
export const IconTeam = (p: P) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3" />
    <path d="M3.5 19.5c1-3.4 3.2-5 5.5-5s4.5 1.6 5.5 5" />
    <circle cx="17" cy="9.5" r="2.4" />
    <path d="M16.5 14.6c2.2.2 3.6 1.6 4.2 4" />
  </Svg>
);
export const IconCheck = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="m8.5 12.3 2.4 2.4 4.6-5" />
  </Svg>
);
export const IconSun = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </Svg>
);
export const IconMoon = (p: P) => (
  <Svg {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </Svg>
);
export const IconLogout = (p: P) => (
  <Svg {...p}>
    <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10" />
    <path d="m14 8 4 4-4 4M18 12H9" />
  </Svg>
);
export const IconArrowRight = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
export const IconMail = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="3" />
    <path d="m4 7.5 8 6 8-6" />
  </Svg>
);
export const IconBuilding = (p: P) => (
  <Svg {...p}>
    <path d="M5 20V5.5A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.5V20" />
    <path d="M15 10h3.5a1.5 1.5 0 0 1 1.5 1.5V20M3.5 20h17M8.5 8h3M8.5 12h3M8.5 16h3" />
  </Svg>
);
export const IconPlane = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 11.5 20.5 4l-4 16-4.5-5.5-8.5-3Z" />
    <path d="M12 14.5 20.5 4" />
  </Svg>
);
export const IconBolt = (p: P) => (
  <Svg {...p}>
    <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" />
  </Svg>
);
export const IconShield = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5 5 6v5.5c0 4.2 2.8 7.2 7 9 4.2-1.8 7-4.8 7-9V6l-7-2.5Z" />
    <path d="m9 12 2.2 2.2L15 10.5" />
  </Svg>
);
export const IconLock = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="3" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Svg>
);
export const IconEye = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);
export const IconEyeOff = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
    <path d="M4 4l16 16" />
  </Svg>
);
export const IconSparkle = (p: P) => (
  <Svg {...p}>
    <path d="m12 4 1.8 4.7 4.7 1.8-4.7 1.8L12 17l-1.8-4.7L5.5 10.5l4.7-1.8L12 4Z" />
  </Svg>
);
export const IconInfo = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 8h.01" />
  </Svg>
);
export const IconAlert = (p: P) => (
  <Svg {...p}>
    <path d="M12 4 3 19.5h18L12 4Z" />
    <path d="M12 10v4.5M12 17.2h.01" />
  </Svg>
);
export const IconMinus = (p: P) => (
  <Svg {...p}>
    <path d="M6 12h12" />
  </Svg>
);
export const IconPlus = (p: P) => (
  <Svg {...p}>
    <path d="M12 6v12M6 12h12" />
  </Svg>
);
