/**
 * The FACET icon set — 24×24 strokes drawn for this library.
 *
 * Every glyph is a list of SVG path strings, stroked with `currentColor` so an
 * icon takes the colour of the text beside it. No glyph is filled, which keeps
 * them legible at 14 px and consistent with the hairline language.
 */
const P = {
  back: ["M15 5l-7 7 7 7"],
  forward: ["M9 5l7 7-7 7"],
  up: ["M5 15l7-7 7 7"],
  down: ["M5 9l7 7 7-7"],
  chevronDown: ["M7 10l5 5 5-5"],
  chevronRight: ["M10 7l5 5-5 5"],
  close: ["M6 6l12 12", "M18 6L6 18"],
  plus: ["M12 5v14", "M5 12h14"],
  minus: ["M5 12h14"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  search: ["M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z", "M15.5 15.5L20 20"],
  filter: ["M4 6h16", "M7 12h10", "M10 18h4"],
  sort: ["M7 5v14", "M4 16l3 3 3-3", "M17 19V5", "M14 8l3-3 3 3"],
  history: ["M4 12a8 8 0 1 0 2.3-5.6", "M4 4v4h4", "M12 8v4l3 2"],
  rotateLeft: ["M5 12a7 7 0 1 0 2.05-4.95", "M7 3v4h4", "M9.5 12h5"],
  rotateRight: ["M19 12a7 7 0 1 1-2.05-4.95", "M17 3v4h-4", "M9.5 12h5"],
  clock: ["M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z", "M12 8v4l3 2"],
  home: ["M4 11l8-6 8 6", "M6 10v9h12v-9"],
  buildings: ["M4 20h16", "M6 20V10h4v10", "M14 20V5h4v15"],
  document: ["M5 4h10l4 4v12H5z", "M15 4v4h4", "M8 12h8", "M8 16h6"],
  shield: ["M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z", "M9 12l2 2 4-4"],
  contents: ["M4 5h16v4H4z", "M6 9v10h12V9", "M10 13h4"],
  book: ["M5 5a2 2 0 0 1 2-2h11v16H7a2 2 0 0 0-2 2z", "M5 5v16", "M9 7h6"],
  scales: ["M12 3v4", "M5 7h14", "M7 7l-3 7h6z", "M17 7l-3 7h6z", "M12 7v13", "M8 20h8"],
  flow: ["M3 7h5v4H3z", "M16 13h5v4h-5z", "M8 9h4v6h4", "M18.5 7a2 2 0 1 1 0 .1"],
  chat: ["M4 5h16v11H9l-5 4z", "M8 9h8", "M8 12h5"],
  spark: [
    "M12 3v4",
    "M12 17v4",
    "M3 12h4",
    "M17 12h4",
    "M6 6l2.5 2.5",
    "M15.5 15.5L18 18",
    "M18 6l-2.5 2.5",
    "M8.5 15.5L6 18",
  ],
  settings: [
    "M4 7h9",
    "M17 7h3",
    "M15 5v4",
    "M4 17h3",
    "M11 17h9",
    "M9 15v4",
    "M4 12h12",
    "M20 12h0",
    "M18 10v4",
  ],
  theme: ["M12 4a8 8 0 1 1 0 16z", "M12 4a8 8 0 1 0 0 16"],
  person: ["M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8z", "M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"],
  team: [
    "M9 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6z",
    "M3 19c1-3 3.3-5 6-5s5 2 6 5",
    "M16 6a2.5 2.5 0 1 1 0 5",
    "M17 14c2 .5 3.4 2.3 4 5",
  ],
  code: ["M9 7l-5 5 5 5", "M15 7l5 5-5 5"],
  anchor: ["M12 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4z", "M12 8v12", "M5 13a7 7 0 0 0 14 0", "M8 11h8"],
  file: ["M6 3h8l4 4v14H6z", "M14 3v4h4"],
  folder: ["M3 6h6l2 2h10v11H3z"],
  flask: ["M9 3h6", "M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"],
  // Two vertically offset blocks.
  offsetBlocks: ["M4 3h6.5v13H4z", "M13.5 8H20v13h-6.5z"],
  checkUnderline: ["M5 12l4 4L19 6", "M5 20h14"],
  bulb: ["M9 18h6", "M10 21h4", "M12 3a6 6 0 0 1 3.5 10.9V16h-7v-2.1A6 6 0 0 1 12 3z"],
  pulse: ["M3 12h4l3-7 4 14 3-7h4"],
  hierarchy: ["M12 4v5", "M12 9H6v4", "M12 9h6v4", "M4 13h4v4H4z", "M16 13h4v4h-4z", "M10 4h4v0"],
  barChart: ["M4 18h16", "M7 18V9", "M12 18V5", "M17 18v-6"],
  checklist: ["M5 4h14v16H5z", "M8 8h8", "M8 12h8", "M8 16h4"],
  link: [
    "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1",
    "M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  ],
  copy: ["M8 8h11v12H8z", "M5 16V4h11"],
  edit: ["M4 20h4L19 9l-4-4L4 16z", "M13 7l4 4"],
  trash: ["M5 7h14", "M9 7V4h6v3", "M7 7l1 13h8l1-13"],
  more: ["M6 12h.01", "M12 12h.01", "M18 12h.01"],
  menu: ["M4 7h16", "M4 12h16", "M4 17h16"],
  expand: ["M14 4h6v6", "M20 4l-7 7", "M10 20H4v-6", "M4 20l7-7"],
  collapse: ["M4 14h6v6", "M10 14l-7 7", "M20 10h-6V4", "M14 10l7-7"],
  dock: ["M3 5h18v14H3z", "M14 5v14"],
  send: ["M4 12l16-8-6 16-3-6z", "M11 14l9-10"],
  stop: ["M7 7h10v10H7z"],
  refresh: ["M20 11a8 8 0 1 0-2.3 5.7", "M20 4v7h-7"],
  external: ["M14 4h6v6", "M20 4l-9 9", "M18 14v6H4V6h6"],
  download: ["M12 4v11", "M7 10l5 5 5-5", "M5 20h14"],
  upload: ["M12 20V9", "M7 14l5-5 5 5", "M5 4h14"],
  lock: ["M6 11h12v9H6z", "M8 11V8a4 4 0 0 1 8 0v3"],
  info: ["M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z", "M12 11v5", "M12 8h.01"],
  warning: ["M12 4l9 16H3z", "M12 10v4", "M12 17h.01"],
  error: ["M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z", "M9 9l6 6", "M15 9l-6 6"],
  branch: [
    "M7 4v12",
    "M7 4a2 2 0 1 1 0 .1",
    "M7 20a2 2 0 1 1 0-.1",
    "M17 8a2 2 0 1 1 0-.1",
    "M17 10c0 4-10 2-10 6",
  ],
  pr: [
    "M7 6a2 2 0 1 1 0-.1",
    "M7 8v10",
    "M7 20a2 2 0 1 1 0-.1",
    "M17 20a2 2 0 1 1 0-.1",
    "M17 18V9a3 3 0 0 0-3-3h-3",
    "M13 4l-2 2 2 2",
  ],
  commit: ["M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z", "M3 12h6", "M15 12h6"],
  play: ["M7 5l12 7-12 7z"],
  pause: ["M8 5v14", "M16 5v14"],
  step: ["M6 5l8 7-8 7z", "M18 5v14"],
  zoomIn: [
    "M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z",
    "M15.5 15.5L20 20",
    "M8 10.5h5",
    "M10.5 8v5",
  ],
  zoomOut: ["M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z", "M15.5 15.5L20 20", "M8 10.5h5"],
  fit: ["M4 9V4h5", "M15 4h5v5", "M20 15v5h-5", "M9 20H4v-5"],
  grid: ["M4 4h7v7H4z", "M13 4h7v7h-7z", "M4 13h7v7H4z", "M13 13h7v7h-7z"],
  list: ["M8 6h12", "M8 12h12", "M8 18h12", "M4 6h.01", "M4 12h.01", "M4 18h.01"],
  table: ["M4 5h16v14H4z", "M4 10h16", "M4 15h16", "M10 5v14"],
  timeline: ["M12 3v18", "M12 7h6", "M6 12h6", "M12 17h5"],
  board: ["M4 4h4v16H4z", "M10 4h4v10h-4z", "M16 4h4v13h-4z"],
  tree: ["M5 4h5v4H5z", "M7.5 8v8h4", "M7.5 12h4", "M12 10h7v4h-7z", "M12 14h7v4h-7z"],
  map: ["M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z", "M9 4v14", "M15 6v14"],
  network: [
    "M12 5a2 2 0 1 1 0 .1",
    "M5 18a2 2 0 1 1 0 .1",
    "M19 18a2 2 0 1 1 0 .1",
    "M12 7l-6 9",
    "M12 7l6 9",
    "M7 18h10",
  ],
  layers: ["M12 4l9 5-9 5-9-5z", "M3 14l9 5 9-5"],
  calendar: ["M4 6h16v14H4z", "M4 10h16", "M8 3v5", "M16 3v5"],
  pin: ["M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z", "M12 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"],
  eye: ["M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z", "M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"],
  keyboard: ["M3 7h18v10H3z", "M6 10h.01", "M10 10h.01", "M14 10h.01", "M18 10h.01", "M7 14h10"],
  plug: ["M9 3v5", "M15 3v5", "M6 8h12v3a6 6 0 0 1-12 0z", "M12 17v4"],
  diamond: ["M12 4l8 8-8 8-8-8z"],
  quote: ["M6 10h4v6H5v-4c0-3 1-5 4-6", "M15 10h4v6h-5v-4c0-3 1-5 4-6"],
  globe: [
    "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z",
    "M3 12h18",
    "M12 3c3 3 3 15 0 18",
    "M12 3c-3 3-3 15 0 18",
  ],
  sun: [
    "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z",
    "M12 2v2",
    "M12 20v2",
    "M2 12h2",
    "M20 12h2",
    "M4.9 4.9l1.4 1.4",
    "M17.7 17.7l1.4 1.4",
    "M19.1 4.9l-1.4 1.4",
    "M6.3 17.7l-1.4 1.4",
  ],
  moon: ["M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z"],
  beaker: ["M8 3h8", "M9 3v6L4 19h16L15 9V3", "M7 14h10"],
};

export type IconName = keyof typeof P;

export const iconNames = Object.keys(P) as IconName[];

export type IconProps = {
  name: IconName;
  size?: number;
  /** When set, the icon is announced; otherwise it is decoration. */
  label?: string;
  className?: string;
};

export function Icon({ name, size = 16, label, className }: IconProps) {
  const paths = P[name] ?? [];
  return (
    <svg
      className={className ? `t-icon ${className}` : "t-icon"}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      style={{ flex: "none" }}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
