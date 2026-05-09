"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./SearchPage.module.css";
import {
  LOL_PLATFORMS, VAL_PLATFORMS, playerUrl,
  getSearchHistory, getFavorites, getTheme, setTheme
} from "@/lib/client";
import { SearchHistoryEntry, Game } from "@/lib/types";

export default function SearchPage() {
  const router = useRouter();
  const [game, setGame] = useState<Game>("lol");
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [platform, setPlatform] = useState("na1");
  const [error, setError] = useState("");
  const [history] = useState<SearchHistoryEntry[]>(() => getSearchHistory());
  const [favorites] = useState<SearchHistoryEntry[]>(() => getFavorites());
  const [theme, setThemeState] = useState<"dark" | "light">(() => getTheme());
  const [activePanel, setActivePanel] = useState<"history" | "favorites">("history");

  const platforms = game === "val" ? VAL_PLATFORMS : LOL_PLATFORMS;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function switchGame(g: Game) {
    setGame(g);
    setPlatform(g === "val" ? "na" : "na1");
    setError("");
  }

  function handleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    setTheme(next);
  }

  function search() {
    const name = gameName.trim();
    const tag = tagLine.trim();
    if (!name || !tag) { setError("Enter both a game name and tag."); return; }
    setError("");
    router.push(playerUrl(name, tag, platform, game));
  }

  function loadEntry(entry: SearchHistoryEntry) {
    router.push(playerUrl(entry.gameName, entry.tagLine, entry.platform, entry.game));
  }

  return (
    <div className={styles.root}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <Link className={styles.logo} href="/">
            <div className={styles.logoDot} />
            RiftScope
          </Link>
          <button className={styles.themeBtn} onClick={handleTheme} title="Toggle theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </header>

        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Track any<br />Riot player</h1>
          <p className={styles.heroSub}>
            Search across League of Legends, Valorant, and TFT. Profile, rank, match history, champion stats, and live games.
          </p>

          <div className={styles.searchCard}>
            <div className={styles.gameTabs}>
              {(["lol", "val", "tft"] as Game[]).map(g => (
                <button
                  key={g}
                  className={`${styles.gameTab} ${game === g ? styles.active : ""}`}
                  data-game={g}
                  onClick={() => switchGame(g)}
                >
                  {g === "lol" ? "⚔️ LoL" : g === "val" ? "🔫 VALORANT" : "♟️ TFT"}
                </button>
              ))}
            </div>

            <div className={styles.searchRow}>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  placeholder="GameName"
                  value={gameName}
                  onChange={e => setGameName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && search()}
                  autoComplete="off"
                />
                <span className={styles.tagSep}>#</span>
                <input
                  type="text"
                  placeholder="TAG"
                  value={tagLine}
                  onChange={e => setTagLine(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && search()}
                  autoComplete="off"
                  style={{ maxWidth: 90 }}
                />
              </div>
              <select
                className={styles.platformSelect}
                value={platform}
                onChange={e => setPlatform(e.target.value)}
              >
                {platforms.map(p => (
                  <option key={p} value={p}>{p.toUpperCase().replace(/\d/g, "")}</option>
                ))}
              </select>
            </div>

            <button className={styles.searchBtn} onClick={search}>
              Search player →
            </button>
          </div>

          {error && <div className={styles.statusBar}>{error}</div>}
        </section>

        {/* HISTORY + FAVORITES */}
        {(history.length > 0 || favorites.length > 0) && (
          <div className={styles.recentSection}>
            <div className={styles.recentTabs}>
              <button
                className={`${styles.recentTab} ${activePanel === "history" ? styles.recentTabActive : ""}`}
                onClick={() => setActivePanel("history")}
              >
                Recent
              </button>
              <button
                className={`${styles.recentTab} ${activePanel === "favorites" ? styles.recentTabActive : ""}`}
                onClick={() => setActivePanel("favorites")}
              >
                ★ Favorites
              </button>
            </div>

            <div className={styles.recentList}>
              {(activePanel === "history" ? history : favorites).map((entry, i) => (
                <button key={i} className={styles.recentItem} onClick={() => loadEntry(entry)}>
                  <div className={styles.recentGameBadge} data-game={entry.game}>
                    {entry.game.toUpperCase()}
                  </div>
                  <div className={styles.recentName}>
                    {entry.gameName}
                    <span className={styles.recentTag}>#{entry.tagLine}</span>
                  </div>
                  <div className={styles.recentPlatform}>{entry.platform.toUpperCase().replace(/\d/g, "")}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <footer className={styles.footer}>
          RiftScope is not endorsed by Riot Games · Data from Riot Games API
        </footer>
      </div>
    </div>
  );
}