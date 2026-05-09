"use client";

import { useEffect, useState, startTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  apiFetch, PLATFORM_TO_REGION, champIconUrl, profileIconUrl, itemIconUrl,
  formatAgo, formatNumber, addToHistory, toggleFavorite, isFavorite, getTheme, setTheme
} from "@/lib/client";
import {
  RiotAccount, Summoner, RankEntry, Match, MatchParticipant,
  LiveGame, ChampionMastery, WinLossStat
} from "@/lib/types";
import styles from "./PlayerPageClient.module.css";

interface Props {
  gameName: string;
  tagLine: string;
  platform: string;
  game: "lol" | "val" | "tft";
}

const TIER_ICONS: Record<string, string> = {
  IRON: "🔩", BRONZE: "🥉", SILVER: "🪙", GOLD: "🥇",
  PLATINUM: "💠", EMERALD: "💚", DIAMOND: "💎",
  MASTER: "🔮", GRANDMASTER: "🔥", CHALLENGER: "👑", UNRANKED: "—",
};

const QUEUE_LABELS: Record<number, string> = {
  420: "Ranked Solo", 440: "Ranked Flex", 450: "ARAM",
  400: "Normal Draft", 430: "Normal Blind", 900: "URF",
};

export default function PlayerPageClient({ gameName, tagLine, platform, game }: Props) {
  const [account, setAccount] = useState<RiotAccount | null>(null);
  const [summoner, setSummoner] = useState<Summoner | null>(null);
  const [rankData, setRankData] = useState<RankEntry[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [mastery, setMastery] = useState<ChampionMastery[]>([]);
  const [liveGame, setLiveGame] = useState<LiveGame | null>(null);
  const [winLossData, setWinLossData] = useState<WinLossStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
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
    return Object.entries(byDay).reverse().slice(0, 10).map(([date, { wins, losses }]) => ({
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
        const sum = await apiFetch<Summoner>(`/api/lol/summoner?puuid=${acc.puuid}&platform=${platform}`);
        setSummoner(sum);
        const sumId = sum.id || sum.encryptedSummonerId;

        const [ranks, matchIds, mast] = await Promise.all([
          sumId ? apiFetch<RankEntry[]>(`/api/lol/rank?summonerId=${sumId}&platform=${platform}`).catch(() => []) : Promise.resolve([]),
          apiFetch<string[]>(`/api/lol/matches?puuid=${acc.puuid}&region=${region}&count=20`),
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

        if (sumId) {
          apiFetch<LiveGame>(`/api/lol/live?summonerId=${sumId}&platform=${platform}`)
            .then(lg => setLiveGame(lg)).catch(() => {});
        }

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

  const soloQ = rankData.find(r => r.queueType === "RANKED_SOLO_5x5");
  const flexQ = rankData.find(r => r.queueType === "RANKED_FLEX_SR");

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
          {[soloQ, flexQ].map((entry, i) => {
            const tier = entry?.tier || "UNRANKED";
            const wr = entry ? Math.round(entry.wins / (entry.wins + entry.losses) * 100) : 0;
            return (
              <div key={i} className={styles.rankCard}>
                <div className={styles.rankIcon}>{TIER_ICONS[tier] || "—"}</div>
                <div className={styles.rankInfo}>
                  <div className={styles.rankQueue}>{i === 0 ? "Solo/Duo" : "Flex"}</div>
                  <div className={`${styles.rankTier} tier-${tier.toLowerCase()}`}>{tier} {entry?.rank || ""}</div>
                  {entry && (
                    <>
                      <div className={styles.rankLP}>{entry.leaguePoints} LP</div>
                      <div className={styles.rankRecord}>{entry.wins}W {entry.losses}L · {wr}%</div>
                    </>
                  )}
                </div>
                {entry && (
                  <div className={styles.rankWRBar}>
                    <div className={styles.rankWRFill} style={{ width: `${wr}%`, background: wr >= 60 ? "var(--accent3)" : wr <= 40 ? "var(--danger)" : "var(--accent)" }} />
                  </div>
                )}
              </div>
            );
          })}

          {/* live game indicator */}
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
          {(["overview", "matches", "mastery", "stats"] as const).map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "overview" ? "Overview" : tab === "matches" ? "Matches" : tab === "mastery" ? "Mastery" : "Stats"}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className={styles.overviewGrid}>
            {/* Recent matches summary */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>Recent Performance</div>
              <div className={styles.perfRow}>
                <div className={styles.wrCircle}>
                  <svg viewBox="0 0 36 36" className={styles.wrSvg}>
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--line2)" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={recentWR >= 60 ? "var(--accent3)" : recentWR <= 40 ? "var(--danger)" : "var(--accent)"}
                      strokeWidth="3"
                      strokeDasharray={`${recentWR} ${100 - recentWR}`}
                      strokeDashoffset="25"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className={styles.wrLabel}>{recentWR}%</div>
                </div>
                <div className={styles.perfStats}>
                  <div className={styles.perfStat}><span>{recentWins}W / {recentTotal - recentWins}L</span><label>Record</label></div>
                  <div className={styles.perfStat}><span>{avgKills}/{avgDeaths}/{avgAssists}</span><label>Avg KDA</label></div>
                  <div className={styles.perfStat}>
                    <span>{Number(avgDeaths) > 0 ? ((Number(avgKills) + Number(avgAssists)) / Number(avgDeaths)).toFixed(2) : "Perfect"}</span>
                    <label>KDA Ratio</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Top champions */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>Top Champions (recent)</div>
              <div className={styles.champList}>
                {buildChampStats().slice(0, 5).map(([name, s]) => {
                  const wr = Math.round(s.wins / s.games * 100);
                  return (
                    <div key={name} className={styles.champRow}>
                      <Image src={champIconUrl(name)} alt={name} width={32} height={32} className={styles.champRowIcon} unoptimized />
                      <div className={styles.champRowName}>{name}</div>
                      <div className={styles.champRowGames}>{s.games}G</div>
                      <div className={styles.champRowWR} style={{ color: wr >= 60 ? "var(--accent3)" : wr <= 40 ? "var(--danger)" : "var(--text)" }}>{wr}%</div>
                      <div className={styles.champRowBar}>
                        <div className={styles.champRowFill} style={{ width: `${wr}%`, background: wr >= 60 ? "var(--accent3)" : wr <= 40 ? "var(--danger)" : "var(--accent)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent 5 matches */}
            <div className={`${styles.card} ${styles.cardFull}`}>
              <div className={styles.cardTitle}>Recent Matches</div>
              <div className={styles.matchList}>
                {playerMatches.slice(0, 5).map(({ match, participant }) =>
                  renderMatchCard(match, participant!)
                )}
              </div>
            </div>
          </div>
        )}

        {/* MATCHES TAB */}
        {activeTab === "matches" && (
          <div className={styles.matchesTab}>
            <div className={styles.matchList}>
              {playerMatches.map(({ match, participant }) =>
                renderMatchCard(match, participant!, true)
              )}
            </div>
          </div>
        )}

        {/* MASTERY TAB */}
        {activeTab === "mastery" && (
          <div className={styles.masteryGrid}>
            {mastery.map((m) => (
              <div key={m.championId} className={styles.masteryCard}>
                <div className={styles.masteryIconWrap}>
                  <div className={styles.masteryLevel}>M{m.championLevel}</div>
                </div>
                <div className={styles.masteryName}>Champion {m.championId}</div>
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

        {/* STATS TAB */}
        {activeTab === "stats" && (
          <div className={styles.statsTab}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Win/Loss by Day (last 20 games)</div>
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

  function renderMatchCard(match: Match, p: MatchParticipant, expandable = false) {
    const win = p.win;
    const champ = p.championName || "?";
    const cs = (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
    const mins = Math.floor(match.info.gameDuration / 60);
    const secs = match.info.gameDuration % 60;
    const queueLabel = QUEUE_LABELS[match.info.queueId] || "Game";
    const kda = p.deaths > 0 ? ((p.kills + p.assists) / p.deaths).toFixed(2) : "Perfect";
    const dmg = p.totalDamageDealtToChampions || 0;
    const isExpanded = expandedMatch === match.metadata.matchId;
    const items = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].filter(Boolean) as number[];

    return (
      <div key={match.metadata.matchId} className={`${styles.matchCard} ${win ? styles.matchWin : styles.matchLoss}`}>
        <div className={styles.matchBar} />
        <div className={styles.matchChamp}>
          <Image src={champIconUrl(champ)} alt={champ} width={44} height={44} className={styles.matchChampImg} unoptimized />
          <div className={styles.matchChampLevel}>Lv.{p.champLevel}</div>
        </div>
        <div className={styles.matchMain}>
          <div className={styles.matchTopRow}>
            <span className={styles.matchQueue}>{queueLabel}</span>
            <span className={styles.matchTime}>{formatAgo(match.info.gameStartTimestamp)}</span>
          </div>
          <div className={styles.matchKDA}>
            <span className={win ? styles.kdaWin : styles.kdaLoss}>{p.kills}</span>
            <span className={styles.kdaSlash}> / </span>
            <span className={styles.kdaDeath}>{p.deaths}</span>
            <span className={styles.kdaSlash}> / </span>
            <span>{p.assists}</span>
            <span className={styles.kdaRatio}>{kda} KDA</span>
          </div>
          <div className={styles.matchMeta}>
            {cs} CS · {mins}m {secs}s · {Math.round(dmg / 1000)}k dmg
          </div>
          {/* Items */}
          <div className={styles.itemRow}>
            {items.map((itemId, i) => (
              <Image key={i} src={itemIconUrl(itemId)} alt={`item${i}`} width={22} height={22} className={styles.itemIcon} unoptimized />
            ))}
            {p.pentaKills ? <span className={styles.pentaTag}>PENTA!</span>
              : p.quadraKills ? <span className={styles.quadraTag}>QUADRA</span>
              : p.tripleKills ? <span className={styles.tripleTag}>TRIPLE</span> : null}
          </div>
        </div>
        <div className={styles.matchRight}>
          <div className={`${styles.matchResult} ${win ? styles.matchWinLabel : styles.matchLossLabel}`}>{win ? "WIN" : "LOSS"}</div>
          {expandable && (
            <button className={styles.expandBtn} onClick={() => setExpandedMatch(isExpanded ? null : match.metadata.matchId)}>
              {isExpanded ? "▲" : "▼"}
            </button>
          )}
        </div>

        {/* EXPANDED SCOREBOARD */}
        {isExpanded && expandable && (
          <div className={styles.scoreboard}>
            {[100, 200].map(teamId => {
              const team = match.info.participants.filter(x => x.teamId === teamId);
              const teamObj = match.info.teams?.find(t => t.teamId === teamId);
              return (
                <div key={teamId} className={styles.scoreboardTeam}>
                  <div className={`${styles.scoreboardHeader} ${teamObj?.win ? styles.sbWin : styles.sbLoss}`}>
                    {teamObj?.win ? "Victory" : "Defeat"} · {teamId === 100 ? "Blue" : "Red"} Side
                    {teamObj?.objectives && (
                      <span className={styles.sbObj}>
                        🏰 {teamObj.objectives.tower?.kills || 0} · 🐉 {teamObj.objectives.dragon?.kills || 0} · 🦁 {teamObj.objectives.baron?.kills || 0}
                      </span>
                    )}
                  </div>
                  {team.map(tp => {
                    const isMe = tp.puuid === account?.puuid;
                    const tpItems = [tp.item0, tp.item1, tp.item2, tp.item3, tp.item4, tp.item5].filter(Boolean) as number[];
                    return (
                      <div key={tp.puuid} className={`${styles.sbRow} ${isMe ? styles.sbRowMe : ""}`}>
                        <Image src={champIconUrl(tp.championName || "?")} alt={tp.championName || ""} width={28} height={28} className={styles.sbChamp} unoptimized />
                        <div className={styles.sbName}>{tp.riotIdGameName || tp.summonerName || "Player"}</div>
                        <div className={styles.sbKDA}>{tp.kills}/{tp.deaths}/{tp.assists}</div>
                        <div className={styles.sbDmg}>{Math.round((tp.totalDamageDealtToChampions || 0) / 1000)}k</div>
                        <div className={styles.sbItems}>
                          {tpItems.map((id, i) => (
                            <Image key={i} src={itemIconUrl(id)} alt="item" width={18} height={18} className={styles.sbItem} unoptimized />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
}