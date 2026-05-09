import { SearchHistoryEntry, Game } from "./types";

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API error");
  return data as T;
}

export const PLATFORM_TO_REGION: Record<string, string> = {
  na1: "americas", br1: "americas", la1: "americas", la2: "americas",
  euw1: "europe", eun1: "europe", tr1: "europe", ru: "europe",
  kr: "asia", jp1: "asia",
  oc1: "sea", sg2: "sea",
};

export const LOL_PLATFORMS = ["na1","euw1","eun1","kr","br1","jp1","la1","la2","oc1","tr1","ru","sg2"];
export const VAL_PLATFORMS = ["na","eu","ap","kr","latam","br"];

export const TIER_ICONS: Record<string, string> = {
  IRON: "🔩", BRONZE: "🥉", SILVER: "🪙", GOLD: "🥇",
  PLATINUM: "💠", EMERALD: "💚", DIAMOND: "💎",
  MASTER: "🔮", GRANDMASTER: "🔥", CHALLENGER: "👑",
  UNRANKED: "—",
};

export const QUEUE_LABELS: Record<number, string> = {
  420: "Ranked Solo", 440: "Ranked Flex", 450: "ARAM",
  400: "Normal Draft", 430: "Normal Blind", 900: "URF",
  1020: "One for All", 1300: "Nexus Blitz",
};

export const DD_VERSION = "14.24.1";
export const DD_BASE = `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}`;

export function champIconUrl(name: string) {
  return `${DD_BASE}/img/champion/${name}.png`;
}

export function profileIconUrl(id: number) {
  return `${DD_BASE}/img/profileicon/${id}.png`;
}

export function itemIconUrl(id: number) {
  return `${DD_BASE}/img/item/${id}.png`;
}

export function formatAgo(ts?: number): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

export function getSearchHistory(): SearchHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("riftscope_history") || "[]");
  } catch { return []; }
}

export function addToHistory(entry: SearchHistoryEntry) {
  if (typeof window === "undefined") return;
  const history = getSearchHistory().filter(
    h => !(h.gameName === entry.gameName && h.tagLine === entry.tagLine && h.platform === entry.platform && h.game === entry.game)
  );
  history.unshift(entry);
  localStorage.setItem("riftscope_history", JSON.stringify(history.slice(0, 10)));
}

export function getFavorites(): SearchHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("riftscope_favorites") || "[]");
  } catch { return []; }
}

export function toggleFavorite(entry: SearchHistoryEntry): boolean {
  if (typeof window === "undefined") return false;
  const favs = getFavorites();
  const idx = favs.findIndex(
    f => f.gameName === entry.gameName && f.tagLine === entry.tagLine && f.platform === entry.platform
  );
  if (idx >= 0) {
    favs.splice(idx, 1);
    localStorage.setItem("riftscope_favorites", JSON.stringify(favs));
    return false;
  } else {
    favs.unshift({ ...entry, timestamp: Date.now() });
    localStorage.setItem("riftscope_favorites", JSON.stringify(favs.slice(0, 20)));
    return true;
  }
}

export function isFavorite(gameName: string, tagLine: string, platform: string): boolean {
  return getFavorites().some(f => f.gameName === gameName && f.tagLine === tagLine && f.platform === platform);
}

export function getTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("riftscope_theme") as "dark" | "light") || "dark";
}

export function setTheme(theme: "dark" | "light") {
  if (typeof window === "undefined") return;
  localStorage.setItem("riftscope_theme", theme);
  document.documentElement.setAttribute("data-theme", theme);
}

export function playerUrl(gameName: string, tagLine: string, platform: string, game: Game) {
  return `/player/${platform}/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}?game=${game}`;
}