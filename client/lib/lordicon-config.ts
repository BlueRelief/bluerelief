/**
 * Centralized Lordicon configuration
 * All Lordicon CDN sources mapped to semantic names for easy reuse across the app
 */

export const LORDICON_SOURCES = {
  // General Icons
  ai: "https://cdn.lordicon.com/ohcvbvqh.json",
  globe: "https://cdn.lordicon.com/oypudwea.json",
  location: "https://cdn.lordicon.com/zosctjws.json",
  bell: "https://cdn.lordicon.com/ahxaipjb.json",
  alert: "https://cdn.lordicon.com/vihyezfv.json",
  info: "https://cdn.lordicon.com/yhtmwrae.json",
  checkCircle: "https://cdn.lordicon.com/zdfcfvwu.json",
  calendar: "https://cdn.lordicon.com/azemaxsk.json",
  activity: "https://cdn.lordicon.com/btfbysou.json",
  clock: "https://cdn.lordicon.com/kiqyrejq.json",
  refresh: "https://cdn.lordicon.com/oxzvhhtl.json",
  trendingUp: "https://cdn.lordicon.com/erxuunyq.json",
  externalLink: "https://cdn.lordicon.com/qnjrwzzi.json",
  document: "https://cdn.lordicon.com/xuoapdes.json",
  search: "https://cdn.lordicon.com/xaekjsls.json",
  filter: "https://cdn.lordicon.com/hvfxzpfu.json",
  close: "https://cdn.lordicon.com/vgpkjbvw.json",
  arrowUpRight: "https://cdn.lordicon.com/excswhey.json",
  arrowDownRight: "https://cdn.lordicon.com/zwtssiaj.json",
  target: "https://cdn.lordicon.com/btfbysou.json", // Using activity/loading icon
  eye: "https://cdn.lordicon.com/xzxvucii.json",
  shieldCheck: "https://cdn.lordicon.com/akawqnfr.json",
  loader: "https://cdn.lordicon.com/oxzvhhtl.json", // Same as refresh
  
  // Navigation Icons (Line style)
  dashboard: "https://cdn.lordicon.com/oeotfwsx.json",
  dataFeed: "https://cdn.lordicon.com/ulcgigyi.json",
  analysis: "https://cdn.lordicon.com/btfbysou.json",
  alerts: "https://cdn.lordicon.com/ahxaipjb.json",
  settings: "https://cdn.lordicon.com/lcawqajy.json",
  
  // Crisis Map (if needed in future)
  map: "https://cdn.lordicon.com/zosctjws.json",
  
  // People/Users
  people: "https://cdn.lordicon.com/kphwxuxr.json",
} as const;

/**
 * Type-safe helper to get Lordicon source URL
 */
export type LordiconName = keyof typeof LORDICON_SOURCES;

export function getLordiconSource(name: LordiconName): string {
  return LORDICON_SOURCES[name];
}

/**
 * Commonly used trigger types for Lordicons
 */
export const LORDICON_TRIGGERS = {
  hover: "hover" as const,
  click: "click" as const,
  loop: "loop" as const,
  loopOnHover: "loop-on-hover" as const,
  playOnceThenHover: "play-once-then-hover" as const,
};

/**
 * Common size presets for consistency
 */
export const LORDICON_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 48,
  "5xl": 64,
} as const;

