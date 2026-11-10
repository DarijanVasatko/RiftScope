"use client";

import { useEffect, useState, startTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  apiFetch, PLATFORM_TO_REGION, champIconUrl, profileIconUrl,
  formatNumber, addToHistory, toggleFavorite, isFavorite, getTheme, setTheme
} from "@/lib/client";
import {
  RiotAccount, Summoner, RankEntry, Match,
  LiveGame, ChampionMastery, WinLossStat, TFTMatch
} from "@/lib/types";
import styles from "./PlayerPageClient.module.css";
import RankChips from "./RankChips";
import TFTMatchHistory from "./TFTMatchHistory";
import WinRateDonut from "./player/WinRateDonut";
import MatchHistoryRow from "./player/MatchHistoryRow";

interface Props {
  gameName: string;
  tagLine: string;
  platform: string;
  game: "lol" | "val" | "tft";
}

export default function PlayerPageClient({ gameName, tagLine, platform, game }: Props) {
  const [account, setAccount] = useState<RiotAccount | null>(null);
  const [summoner, setSummoner] = useState<Summoner | null>(null);
  const [rankData, setRankData] = useState<RankEntry[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tftMatches, setTftMatches] = useState<TFTMatch[]>([]);
  const [mastery, setMastery] = useState<ChampionMastery[]>([]);
  const [liveGame, setLiveGame] = useState<LiveGame | null>(null);
  const [winLossData, setWinLossData] = useState<WinLossStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorited, setFavorited] = useState(false);
  const [theme, setThemeState] = useState<"dark" | "light">(() => getTheme());
  const [activeTab, setActiveTab] = useState<"overview" | "matches" | "mastery" | "stats">("overview");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function buildWinLoss(matchList: Match[], puuid: string): WinLossStat[] {
    const byDay: Record<string, { wins: number; losses: number }> = {};
    for (const m of matchList) {
      const p = m.info?.participants?.find(x => x.puuid === puuid);
      if (!p) continue;
      const date = new Date(m.info.gameStartTimestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      if (!byDay[date]) byDay[date] = { wins: 0, losses: 0 };
      if (p.win) byDay[date].wins++; else byDay[date].losses++;
    }
    return Object.entries(byDay).slice(0, 10).reverse().map(([date, { wins, losses }]) => ({
      date, wins, losses, wr: wins + losses > 0 ? Math.round(wins / (wins + losses) * 100) : 0
    }));
  }

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const region = PLATFORM_TO_REGION[platform] || "americas";
      const acc = await apiFetch<RiotAccount>(
        `/api/account?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&region=${region}`
      );
      setAccount(acc);
      setFavorited(isFavorite(acc.gameName, acc.tagLine, platform));

      if (game === "lol") {
        const sum = await apiFetch<Summoner>(`/api/lol/summoner?puuid=${acc.puuid}&platform=${platform}`).catch(() => null);
        if (sum) setSummoner(sum);
        const sumId = sum?.id || sum?.encryptedSummonerId;

        const [ranks, matchIds, mast] = await Promise.all([
          sumId ? apiFetch<RankEntry[]>(`/api/lol/rank?summonerId=${sumId}&platform=${platform}`).catch(() => []) : Promise.resolve([]),
          apiFetch<string[]>(`/api/lol/matches?puuid=${acc.puuid}&region=${region}&count=20`).catch(() => []),
          apiFetch<ChampionMastery[]>(`/api/lol/mastery?puuid=${acc.puuid}&platform=${platform}&count=12`).catch(() => []),
        ]);

        setRankData(ranks as RankEntry[]);
        setMastery(mast as ChampionMastery[]);

        const matchDetails = (await Promise.all(
          (matchIds as string[]).slice(0, 20).map((id: string) =>
            apiFetch<Match>(`/api/lol/match?matchId=${id}&region=${region}`).catch(() => null)
          )
        )).filter(Boolean) as Match[];
        setMatches(matchDetails);
        setWinLossData(buildWinLoss(matchDetails, acc.puuid));

        apiFetch<LiveGame>(`/api/lol/live?puuid=${acc.puuid}&platform=${platform}`)
          .then(lg => setLiveGame(lg)).catch(() => {});

        addToHistory({ gameName: acc.gameName, tagLine: acc.tagLine, platform, game, timestamp: Date.now() });
      } else if (game === "tft") {
        const sum = await apiFetch<Summoner>(`/api/tft/summoner?puuid=${acc.puuid}&platform=${platform}`).catch(() => null);
        if (sum) setSummoner(sum);
        const sumId = sum?.id || sum?.encryptedSummonerId;

        const [ranks, matchIds] = await Promise.all([
          sumId ? apiFetch<RankEntry[]>(`/api/tft/rank?summonerId=${sumId}&platform=${platform}`).catch(() => []) : Promise.resolve([]),
          apiFetch<string[]>(`/api/tft/matches?puuid=${acc.puuid}&region=${region}&count=20`).catch(() => []),
        ]);

        setRankData(ranks as RankEntry[]);
        const matchDetails = (await Promise.all(
          (matchIds as string[]).slice(0, 20).map((id: string) =>
            apiFetch<TFTMatch>(`/api/tft/match?matchId=${id}&region=${region}`).catch(() => null)
          )
        )).filter(Boolean) as TFTMatch[];
        setTftMatches(matchDetails);

        addToHistory({ gameName: acc.gameName, tagLine: acc.tagLine, platform, game, timestamp: Date.now() });
      } else if (game === "val") {
        await apiFetch<unknown>(`/api/val/matches?puuid=${acc.puuid}&platform=${platform}`).catch(() => null);
        addToHistory({ gameName: acc.gameName, tagLine: acc.tagLine, platform, game, timestamp: Date.now() });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load player");
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { startTransition(() => { loadData(); }); }, [gameName, tagLine, platform, game]);

  function handleToggleFav() {
    if (!account) return;
    const now = toggleFavorite({ gameName: account.gameName, tagLine: account.tagLine, platform, game, timestamp: Date.now() });
    setFavorited(now);
  }

  function handleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    setTheme(next);
  }

  const soloQ = rankData.find(e => e.queueType === "RANKED_SOLO_5x5") || null;
  const flexQ = rankData.find(e => e.queueType === "RANKED_FLEX_SR") || null;
  const tftRank = rankData.find(e => e.queueType === "RANKED_TFT") || null;

  const playerMatches = matches.map(m => ({
    match: m,
    participant: m.info?.participants?.find(p => p.puuid === account?.puuid),
  })).filter(x => x.participant);

  const recentWins = playerMatches.filter(x => x.participant!.win).length;
  const recentTotal = playerMatches.length;
  const recentWR = recentTotal > 0 ? Math.round(recentWins / recentTotal * 100) : 0;
  const avgKills = recentTotal > 0 ? (playerMatches.reduce((s, x) => s + x.participant!.kills, 0) / recentTotal).toFixed(1) : "0";
  const avgDeaths = recentTotal > 0 ? (playerMatches.reduce((s, x) => s + x.participant!.deaths, 0) / recentTotal).toFixed(1) : "0";
  const avgAssists = recentTotal > 0 ? (playerMatches.reduce((s, x) => s + x.participant!.assists, 0) / recentTotal).toFixed(1) : "0";

  if (loading) return (
    <div className={styles.loadingPage}>
      <div className={styles.spinner} />
      <div className={styles.loadingText}>Loading {gameName}#{tagLine}...</div>
    </div>
  );

  if (error) return (
    <div className={styles.errorPage}>
      <div className={styles.errorIcon}>⚠</div>
      <div className={styles.errorMsg}>{error}</div>
      <Link href="/" className={styles.backBtn}>← Back to search</Link>
    </div>
  );

  return (
    <div className={styles.root} data-theme={theme}>
      {/* NAV */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoDot} />
            RiftScope
          </Link>
          <div className={styles.navActions}>
            <button className={styles.themeBtn} onClick={handleTheme} title="Toggle theme">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </nav>

      <div className={styles.wrap}>
        {/* HERO BANNER */}
        <div className={styles.heroBanner}>
          <div className={styles.heroLeft}>
            {summoner && (
              <div className={styles.avatarWrap}>
                <Image
                  src={profileIconUrl(summoner.profileIconId)}
                  alt="icon"
                  width={88}
                  height={88}
                  className={styles.avatar}
                  unoptimized
                />
                <div className={styles.levelBadge}>{summoner.summonerLevel}</div>
              </div>
            )}
            <div className={styles.heroInfo}>
              <div className={styles.heroName}>
                {account?.gameName}
                <span className={styles.heroTag}>#{account?.tagLine}</span>
              </div>
              <div className={styles.heroPlatform}>{platform.toUpperCase()} · {game.toUpperCase()}</div>
              {recentTotal > 0 && (
                <div className={styles.heroStats}>
                  <span className={styles.heroStatItem}>{recentWins}W {recentTotal - recentWins}L</span>
                  <span className={styles.heroStatSep}>·</span>
                  <span className={styles.heroStatItem} style={{ color: recentWR >= 60 ? "var(--accent3)" : recentWR <= 40 ? "var(--danger)" : "var(--text)" }}>
                    {recentWR}% WR
                  </span>
                  <span className={styles.heroStatSep}>·</span>
                  <span className={styles.heroStatItem}>{avgKills}/{avgDeaths}/{avgAssists} KDA</span>
                </div>
              )}
            </div>
          </div>
          <div className={styles.heroRight}>
            <button
              className={`${styles.favBtn} ${favorited ? styles.favActive : ""}`}
              onClick={handleToggleFav}
              title={favorited ? "Remove from favorites" : "Add to favorites"}
            >
              {favorited ? "★" : "☆"}
            </button>
            <button className={styles.refreshBtn} onClick={loadData}>↻ Refresh</button>
          </div>
        </div>

        {/* RANK CARDS */}
        <div className={styles.rankRow}>
          <RankChips 
            entries={game === "tft" ? [tftRank] : [soloQ, flexQ]} 
            labels={game === "tft" ? ["TFT RANKED"] : ["SOLO/DUO", "FLEX"]} 
          />

          {/* Live game indicator for LoL */}
          {liveGame && (
            <div className={`${styles.rankCard} ${styles.liveCard}`}>
              <div className={styles.livePulse}><span className={styles.liveDot} />LIVE</div>
              <div className={styles.liveMode}>{liveGame.gameMode}</div>
              <div className={styles.liveDuration}>
                {liveGame.gameLength ? `${Math.floor(liveGame.gameLength / 60)}m ${liveGame.gameLength % 60}s` : "In game"}
              </div>
            </div>
          )}
        </div>

        {/* TABS */}
        <div className={styles.tabs}>
          {(["overview", "matches", ...(game === "lol" ? ["mastery", "stats"] : [])] as const).map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab as "overview" | "matches" | "mastery" | "stats")}
            >
              {tab === "overview" ? "Overview" : tab === "matches" ? "Matches" : tab === "mastery" ? "Mastery" : "Stats"}
            </button>
          ))}
        </div>

        {/* TFT VIEW */}
        {game === "tft" && (
          <div style={{ marginTop: 24 }}>
            <TFTMatchHistory matches={tftMatches} puuid={account?.puuid || ""} />
          </div>
        )}

        {/* LOL OVERVIEW TAB */}
        {game === "lol" && activeTab === "overview" && (
          <div className="flex flex-col gap-4">
            {/* Top row: WinRateDonut & Top Champions side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WinRateDonut
                wins={recentWins}
                losses={recentTotal - recentWins}
                kills={avgKills}
                deaths={avgDeaths}
                assists={avgAssists}
                label="Recent Performance"
              />

              {/* Top champions */}
              <div className="p-4 rounded-xl bg-[#181E26] border border-[#232B36] flex flex-col justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#A0A8B6] mb-2">
                  Top Champions (Recent)
                </div>
                <div className="flex flex-col gap-2">
                  {buildChampStats().slice(0, 4).map(([name, s]) => {
                    const wr = Math.round((s.wins / s.games) * 100);
                    return (
                      <div key={name} className="flex items-center gap-2.5 text-xs">
                        <Image
                          src={champIconUrl(name)}
                          alt={name}
                          width={28}
                          height={28}
                          className="rounded-md object-cover border border-[#232B36]"
                          unoptimized
                        />
                        <div className="w-24 font-semibold truncate text-[#F0E6D2]">
                          {name}
                        </div>
                        <div className="text-[11px] text-[#A0A8B6] font-mono">
                          {s.games}G
                        </div>
                        <div
                          className="text-[11px] font-bold font-mono ml-auto"
                          style={{
                            color: wr >= 60 ? "#4B99C2" : wr <= 40 ? "#E84057" : "#F0E6D2",
                          }}
                        >
                          {wr}%
                        </div>
                        <div className="w-20 h-1.5 bg-[#232B36] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${wr}%`,
                              backgroundColor: wr >= 60 ? "#4B99C2" : wr <= 40 ? "#E84057" : "#C4A15B",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent 5 matches */}
            <div className="flex flex-col gap-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#A0A8B6] px-1">
                Recent Matches
              </div>
              <div className="flex flex-col gap-2.5">
                {playerMatches.slice(0, 5).map(({ match, participant }) => (
                  <MatchHistoryRow
                    key={match.metadata.matchId}
                    match={match}
                    participant={participant!}
                    currentPuuid={account?.puuid}
                    platform={platform}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LOL MATCHES TAB */}
        {game === "lol" && activeTab === "matches" && (
          <div className="flex flex-col gap-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#A0A8B6] px-1">
              Match History ({playerMatches.length} Games)
            </div>
            <div className="flex flex-col gap-2.5">
              {playerMatches.map(({ match, participant }) => (
                <MatchHistoryRow
                  key={match.metadata.matchId}
                  match={match}
                  participant={participant!}
                  currentPuuid={account?.puuid}
                  platform={platform}
                />
              ))}
            </div>
          </div>
        )}

        {/* LOL MASTERY TAB */}
        {game === "lol" && activeTab === "mastery" && (
          <div className={styles.masteryGrid}>
            {mastery.map((m) => (
              <div key={m.championId} className={styles.masteryCard}>
                <div className={styles.masteryIconWrap}>
                  <div className={styles.masteryLevel}>M{m.championLevel}</div>
                </div>
                <div className={styles.masteryName}>Champion #{m.championId}</div>
                <div className={styles.masteryPoints}>{formatNumber(m.championPoints)} pts</div>
                <div className={styles.masteryBar}>
                  <div
                    className={styles.masteryBarFill}
                    style={{ width: `${Math.min(100, (m.championPoints / 100000) * 100)}%` }}
                  />
                </div>
                {m.chestGranted && <div className={styles.masteryChest}>🎁 Chest</div>}
              </div>
            ))}
          </div>
        )}

        {/* LOL STATS TAB */}
        {game === "lol" && activeTab === "stats" && (
          <div className={styles.statsTab}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Win/Loss by Day (recent games)</div>
              <div className={styles.wlChart}>
                {winLossData.map((d) => (
                  <div key={d.date} className={styles.wlBar}>
                    <div className={styles.wlStacked}>
                      <div className={styles.wlWin} style={{ height: `${d.wins * 20}px` }} title={`${d.wins} wins`} />
                      <div className={styles.wlLoss} style={{ height: `${d.losses * 20}px` }} title={`${d.losses} losses`} />
                    </div>
                    <div className={styles.wlDate}>{d.date}</div>
                    <div className={styles.wlWR}>{d.wr}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <div className={styles.statBoxVal}>{recentWR}%</div>
                <div className={styles.statBoxLabel}>Win Rate</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statBoxVal}>{avgKills}</div>
                <div className={styles.statBoxLabel}>Avg Kills</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statBoxVal}>{avgDeaths}</div>
                <div className={styles.statBoxLabel}>Avg Deaths</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statBoxVal}>{avgAssists}</div>
                <div className={styles.statBoxLabel}>Avg Assists</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statBoxVal}>
                  {Number(avgDeaths) > 0 ? ((Number(avgKills) + Number(avgAssists)) / Number(avgDeaths)).toFixed(2) : "Perfect"}
                </div>
                <div className={styles.statBoxLabel}>KDA Ratio</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statBoxVal}>
                  {recentTotal > 0
                    ? Math.round(playerMatches.reduce((s, x) => s + (x.participant!.totalMinionsKilled || 0) + (x.participant!.neutralMinionsKilled || 0), 0) / recentTotal)
                    : 0}
                </div>
                <div className={styles.statBoxLabel}>Avg CS</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Champion Performance</div>
              <div className={styles.champTable}>
                <div className={styles.champTableHead}>
                  <span>Champion</span><span>Games</span><span>WR</span><span>KDA</span><span>Avg CS</span>
                </div>
                {buildChampStats().map(([name, s]) => {
                  const wr = Math.round(s.wins / s.games * 100);
                  const kda = s.deaths > 0 ? ((s.kills + s.assists) / s.deaths).toFixed(2) : "Perfect";
                  const avgCs = Math.round(s.cs / s.games);
                  return (
                    <div key={name} className={styles.champTableRow}>
                      <span className={styles.champTableName}>
                        <Image src={champIconUrl(name)} alt={name} width={24} height={24} className={styles.champTableIcon} unoptimized />
                        {name}
                      </span>
                      <span>{s.games}</span>
                      <span style={{ color: wr >= 60 ? "var(--accent3)" : wr <= 40 ? "var(--danger)" : "var(--text)" }}>{wr}%</span>
                      <span>{kda}</span>
                      <span>{avgCs}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function buildChampStats() {
    const stats: Record<string, { games: number; wins: number; kills: number; deaths: number; assists: number; cs: number }> = {};
    for (const { participant: p } of playerMatches) {
      if (!p) continue;
      const name = p.championName || "Unknown";
      if (!stats[name]) stats[name] = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, cs: 0 };
      stats[name].games++;
      if (p.win) stats[name].wins++;
      stats[name].kills += p.kills;
      stats[name].deaths += p.deaths;
      stats[name].assists += p.assists;
      stats[name].cs += (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
    }
    return Object.entries(stats).sort((a, b) => b[1].games - a[1].games);
  }
}
