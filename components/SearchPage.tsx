"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./SearchPage.module.css";
import { apiFetch, PLATFORM_TO_REGION, LOL_PLATFORMS, VAL_PLATFORMS } from "@/lib/client";
import { RiotAccount, Summoner, RankEntry, Match, LiveGame, TFTMatch } from "@/lib/types";
import ProfileBanner from "./ProfileBanner";
import RankChips from "./RankChips";
import MatchHistory from "./MatchHistory";
import TFTMatchHistory from "./TFTMatchHistory";
import ChampStats from "./ChampStats";
import LiveGamePanel from "./LiveGamePanel";

type Game = "lol" | "val" | "tft";

export default function SearchPage() {
  const [game, setGame] = useState<Game>("lol");
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [platform, setPlatform] = useState("na1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<React.ReactNode>(null);

  const platforms = game === "val" ? VAL_PLATFORMS : LOL_PLATFORMS;

  function switchGame(g: Game) {
    setGame(g);
    setPlatform(g === "val" ? "na" : "na1");
    setResults(null);
    setError("");
  }

  async function search() {
    if (!gameName || !tagLine) { setError("Enter both a game name and tag."); return; }
    setError("");
    setLoading(true);
    setResults(null);

    try {
      const region = PLATFORM_TO_REGION[platform] || "americas";
      const account = await apiFetch<RiotAccount>(
        `/api/account?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&region=${region}`
      );

      if (game === "lol") await renderLoL(account, platform, region);
      else if (game === "tft") await renderTFT(account, platform, region);
      else await renderVal(account, platform);

    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function renderLoL(account: RiotAccount, platform: string, region: string) {
    const summoner = await apiFetch<Summoner>(`/api/lol/summoner?puuid=${account.puuid}&platform=${platform}`);
    const rankData = await apiFetch<RankEntry[]>(`/api/lol/rank?summonerId=${summoner.id}&platform=${platform}`);
    const matchIds = await apiFetch<string[]>(`/api/lol/matches?puuid=${account.puuid}&region=${region}&count=10`);

    const matches = (await Promise.all(
      matchIds.slice(0, 10).map(id =>
        apiFetch<Match>(`/api/lol/match?matchId=${id}&region=${region}`).catch(() => null)
      )
    )).filter(Boolean) as Match[];

    let liveGame: LiveGame | null = null;
    try { liveGame = await apiFetch<LiveGame>(`/api/lol/live?summonerId=${summoner.id}&platform=${platform}`); } catch {}

    const soloQ = rankData.find(r => r.queueType === "RANKED_SOLO_5x5");
    const flexQ = rankData.find(r => r.queueType === "RANKED_FLEX_SR");
    const iconUrl = `https://ddragon.leagueoflegends.com/cdn/14.12.1/img/profileicon/${summoner.profileIconId}.png`;

    setResults(
      <>
        <ProfileBanner account={account} summoner={summoner} iconUrl={iconUrl} platformLabel={platform.toUpperCase()} />
        <RankChips entries={[soloQ ?? null, flexQ ?? null]} labels={["Solo/Duo", "Flex"]} />
        <LiveGamePanel liveGame={liveGame} puuid={account.puuid} />
        <MatchHistory matches={matches} puuid={account.puuid} />
        <ChampStats matches={matches} puuid={account.puuid} />
      </>
    );
  }

  async function renderTFT(account: RiotAccount, platform: string, region: string) {
    const summoner = await apiFetch<Summoner>(`/api/tft/summoner?puuid=${account.puuid}&platform=${platform}`);
    const rankData = await apiFetch<RankEntry[]>(`/api/tft/rank?summonerId=${summoner.id}&platform=${platform}`);
    const matchIds = await apiFetch<string[]>(`/api/tft/matches?puuid=${account.puuid}&region=${region}&count=10`);

    const matches = (await Promise.all(
      matchIds.slice(0, 10).map(id =>
        apiFetch<TFTMatch>(`/api/tft/match?matchId=${id}&region=${region}`).catch(() => null)
      )
    )).filter(Boolean) as TFTMatch[];

    const iconUrl = `https://ddragon.leagueoflegends.com/cdn/14.12.1/img/profileicon/${summoner.profileIconId}.png`;

    setResults(
      <>
        <ProfileBanner account={account} summoner={summoner} iconUrl={iconUrl} platformLabel={platform.toUpperCase()} />
        <RankChips entries={[rankData[0] ?? null]} labels={["TFT Ranked"]} />
        <TFTMatchHistory matches={matches} puuid={account.puuid} />
      </>
    );
  }

  async function renderVal(account: RiotAccount, platform: string) {
    const matchData = await apiFetch<{ history: Array<{ matchId: string }> }>(
      `/api/val/matches?puuid=${account.puuid}&platform=${platform}`
    ).catch(() => ({ history: [] }));

    type ValPlayer = { puuid: string; character: string; team: string; stats?: { kills: number; deaths: number; assists: number; score: number; headShots: number } };
    type ValMatch = { matchInfo?: { queueId?: string }; players?: { allPlayers?: ValPlayer[] }; teams?: { winner: string } };

    const matchDetails = (await Promise.all(
      (matchData.history || []).slice(0, 8).map(m =>
        apiFetch<ValMatch>(`/api/val/match?matchId=${m.matchId}&platform=${platform}`).catch(() => null)
      )
    )).filter((m): m is ValMatch => m !== null);

    setResults(
      <div>
        <div className={styles.profileBanner}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar} style={{ fontSize: 14, color: "var(--val)" }}>
              {(account.gameName || "?")[0].toUpperCase()}
            </div>
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>
              {account.gameName}<span className={styles.profileTag}>#{account.tagLine}</span>
            </div>
            <div className={styles.profileMeta}>VALORANT · {platform.toUpperCase()} · PUUID: {account.puuid.slice(0, 12)}...</div>
          </div>
        </div>

        {matchDetails.length > 0 ? (
          <>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>Recent Matches</div>
              <div className={styles.sectionLine} />
            </div>
            <div className={styles.matchList}>
              {matchDetails.map((m, i) => {
                const player = m?.players?.allPlayers?.find((p) => p.puuid === account.puuid);
                if (!player) return null;
                const win = player.team === m?.teams?.winner;
                return (
                  <div key={i} className={styles.matchCard}>
                    <div className={`${styles.matchResultBar} ${win ? styles.win : styles.loss}`} />
                    <div className={styles.matchChampWrap}>
                      <div className={styles.champIcon}>{(player.character || "?").slice(0, 2)}</div>
                    </div>
                    <div className={styles.matchMain}>
                      <div className={styles.matchMode}>{m?.matchInfo?.queueId || "VALORANT"}</div>
                      <div className={styles.matchKda}>
                        {player.stats?.kills ?? 0}
                        <span className={styles.slash}> / </span>
                        {player.stats?.deaths ?? 0}
                        <span className={styles.slash}> / </span>
                        {player.stats?.assists ?? 0}
                      </div>
                      <div className={styles.matchStats}>ACS {player.stats?.score ?? 0} · HS {player.stats?.headShots ?? 0}</div>
                    </div>
                    <div className={styles.matchSide}>
                      <div className={`${styles.matchResultLabel} ${win ? styles.win : styles.loss}`}>{win ? "WIN" : "LOSS"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className={styles.notInGame}>No recent VALORANT matches found for this account.</div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <Link className={styles.logo} href="/">
            <div className={styles.logoDot} />
            RiftScope
          </Link>
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

            <button
              className={styles.searchBtn}
              onClick={search}
              disabled={loading}
            >
              {loading ? "Searching..." : "Search player →"}
            </button>
          </div>

          {error && <div className={styles.statusBar}>{error}</div>}
        </section>

        {loading && (
          <div className={styles.loader}>
            <div className={styles.spinner} />
            Fetching player data...
          </div>
        )}

        {results && <div className={styles.results}>{results}</div>}

        <footer className={styles.footer}>
          RiftScope is not endorsed by Riot Games · Data from Riot Games API
        </footer>
      </div>
    </div>
  );
}