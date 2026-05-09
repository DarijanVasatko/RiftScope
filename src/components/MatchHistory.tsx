import Image from "next/image";
import { Match } from "@/lib/types";
import { QUEUE_LABELS, formatAgo } from "@/lib/client";
import styles from "./MatchHistory.module.css";

interface Props {
  matches: Match[];
  puuid: string;
}

export default function MatchHistory({ matches, puuid }: Props) {
  if (!matches.length) return null;

  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>Match History</div>
        <div className={styles.sectionLine} />
      </div>
      <div className={styles.list}>
        {matches.slice(0, 10).map((match) => {
          const p = match.info?.participants?.find(x => x.puuid === puuid);
          if (!p) return null;
          const win = p.win;
          const champ = p.championName || "?";
          const cs = (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
          const mins = match.info?.gameDuration ? Math.floor(match.info.gameDuration / 60) : 0;
          const queueLabel = QUEUE_LABELS[match.info?.queueId] || "Game";
          const iconUrl = `https://ddragon.leagueoflegends.com/cdn/14.12.1/img/champion/${champ}.png`;

          return (
            <div key={match.metadata.matchId} className={styles.card}>
              <div className={`${styles.bar} ${win ? styles.win : styles.loss}`} />
              <div className={styles.champWrap}>
                <div className={styles.champIcon}>
                  <Image src={iconUrl} alt={champ} width={40} height={40} unoptimized />
                </div>
                <div className={styles.champLevel}>Lv.{p.champLevel}</div>
              </div>
              <div className={styles.main}>
                <div className={styles.mode}>{queueLabel}</div>
                <div className={styles.kda}>
                  {p.kills}<span className={styles.slash}> / </span>{p.deaths}<span className={styles.slash}> / </span>{p.assists}
                </div>
                <div className={styles.stats}>{cs} CS · {mins}m</div>
              </div>
              <div className={styles.side}>
                <div className={`${styles.result} ${win ? styles.win : styles.loss}`}>{win ? "WIN" : "LOSS"}</div>
                <div className={styles.time}>{formatAgo(match.info?.gameStartTimestamp)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}