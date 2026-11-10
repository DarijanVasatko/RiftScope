import { SearchHistoryEntry, Game } from "./types";
import { useSyncExternalStore } from "react";

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API error");
  return data as T;
}

export const PLATFORM_TO_REGION: Record<string, string> = {
  // LoL / TFT
  na1: "americas", br1: "americas", la1: "americas", la2: "americas",
  euw1: "europe", eun1: "europe", tr1: "europe", ru: "europe",
  kr: "asia", jp1: "asia",
  oc1: "sea", sg2: "sea",
  // Valorant
  na: "americas", latam: "americas", br: "americas",
  eu: "europe",
  ap: "sea",
};

export const REGION_DISPLAY_NAMES: Record<string, string> = {
  na1: "NA", euw1: "EUW", eun1: "EUNE", kr: "KR",
  jp1: "JP", br1: "BR", la1: "LAN", la2: "LAS",
  oc1: "OCE", tr1: "TR", ru: "RU", sg2: "SG",
  na: "NA", eu: "EU", ap: "AP", latam: "LATAM", br: "BR",
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
  1020: "One for All", 1300: "Nexus Blitz", 1400: "Ultimate Spellbook",
  1700: "Arena (2v2v2v2)", 1710: "Arena",
};

export const DD_VERSION = "16.8.1";
export const DD_BASE = `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}`;

const CHAMP_NAME_MAP: Record<string, string> = {
  "Wukong": "MonkeyKing",
  "Renata": "Renata",
};

export function champIconUrl(name: string) {
  const mapped = CHAMP_NAME_MAP[name] || name;
  return `${DD_BASE}/img/champion/${mapped}.png`;
}

export function profileIconUrl(id: number) {
  return `${DD_BASE}/img/profileicon/${id}.png`;
}

export function itemIconUrl(id: number) {
  return `${DD_BASE}/img/item/${id}.png`;
}

export function spellIconUrl(spellKey: string) {
  return `${DD_BASE}/img/spell/${spellKey}.png`;
}

export function runeIconUrl(runeId: number) {
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/styles/${runeId}.png`.toLowerCase();
}

// Summoner spell ID → key mapping
export const SUMMONER_SPELLS: Record<number, string> = {
  1: "SummonerBoost", 3: "SummonerExhaust", 4: "SummonerFlash",
  6: "SummonerHaste", 7: "SummonerHeal", 11: "SummonerSmite",
  12: "SummonerTeleport", 13: "SummonerMana", 14: "SummonerDot",
  21: "SummonerBarrier", 32: "SummonerSnowball", 39: "SummonerSnowURFSnowball_Mark",
  54: "Summoner_UltBookPlaceholder", 55: "Summoner_UltBookSmitePlaceholder",
};

// Rune path IDs
export const RUNE_PATHS: Record<number, { name: string; icon: string }> = {
  8000: { name: "Precision", icon: "precision" },
  8100: { name: "Domination", icon: "domination" },
  8200: { name: "Sorcery", icon: "sorcery" },
  8300: { name: "Inspiration", icon: "inspiration" },
  8400: { name: "Resolve", icon: "resolve" },
};

export function formatAgo(ts?: number): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
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

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getSearchHistory(): SearchHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("riftscope_history") || "[]"); }
  catch { return []; }
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
  try { return JSON.parse(localStorage.getItem("riftscope_favorites") || "[]"); }
  catch { return []; }
}

export function toggleFavorite(entry: SearchHistoryEntry): boolean {
  if (typeof window === "undefined") return false;
  const favs = getFavorites();
  const idx = favs.findIndex(f => f.gameName === entry.gameName && f.tagLine === entry.tagLine && f.platform === entry.platform);
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

export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
