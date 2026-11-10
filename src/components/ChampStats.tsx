import Image from "next/image";
import { Match } from "@/lib/types";
import { champIconUrl } from "@/lib/client";
import styles from "./ChampStats.module.css";

interface Props {
  matches: Match[];
  puuid: string;
}

export default function ChampStats({ matches, puuid }: Props) {
  const stats: Record<string, { games: number; wins: number; kills: number; deaths: number; assists: number }> = {};

  for (const match of matches) {
    const p = match.info?.participants?.find(x => x.puuid === puuid);
    if (!p) continue;
    const name = p.championName || "Unknown";
    if (!stats[name]) stats[name] = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
    stats[name].games++;
    if (p.win) stats[name].wins++;
    stats[name].kills += p.kills;
    stats[name].deaths += p.deaths;
    stats[name].assists += p.assists;
  }

  const champList = Object.entries(stats).sort((a, b) => b[1].games - a[1].games).slice(0, 6);
  if (!champList.length) return null;

  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>Champion Stats</div>
        <div className={styles.sectionLine} />
      </div>
      <div className={styles.grid}>
        {champList.map(([name, s]) => {
          const wr = Math.round(s.wins / s.games * 100);
          const avgKda = s.deaths > 0 ? ((s.kills + s.assists) / s.deaths).toFixed(2) : "Perfect";
          const wrColor = wr >= 60 ? "var(--accent3)" : wr <= 40 ? "var(--danger)" : "var(--text)";

          return (
            <div key={name} className={styles.card}>
              <div className={styles.icon}>
                <Image src={champIconUrl(name)} alt={name} width={44} height={44} unoptimized />
              </div>
              <div className={styles.info}>
                <div className={styles.name}>{name}</div>
                <div className={styles.nums}>{s.games}G · {avgKda} KDA</div>
              </div>
              <div className={styles.wr} style={{ color: wrColor }}>{wr}%</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
