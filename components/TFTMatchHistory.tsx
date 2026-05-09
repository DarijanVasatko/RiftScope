import { TFTMatch } from "@/lib/types";
import { formatAgo } from "@/lib/client";
import styles from "./TFTMatchHistory.module.css";

interface Props {
  matches: TFTMatch[];
  puuid: string;
}

export default function TFTMatchHistory({ matches, puuid }: Props) {
  if (!matches.length) {
    return <div className={styles.empty}>No recent TFT matches found.</div>;
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>TFT Match History</div>
        <div className={styles.sectionLine} />
      </div>
      <div className={styles.list}>
        {matches.map((match) => {
          const p = match.info?.participants?.find(x => x.puuid === puuid);
          if (!p) return null;
          const isTop4 = p.placement <= 4;
          const mins = match.info?.game_length ? Math.floor(match.info.game_length / 60) : 0;

          return (
            <div key={match.metadata.match_id} className={styles.card}>
              <div className={`${styles.bar} ${isTop4 ? styles.win : styles.loss}`} />
              <div className={styles.champWrap}>
                <div className={`${styles.placement} ${isTop4 ? styles.win : styles.loss}`}>
                  #{p.placement}
                </div>
              </div>
              <div className={styles.main}>
                <div className={styles.mode}>TFT RANKED</div>
                <div className={styles.kda}>Level {p.level ?? "?"} · {p.traits?.length ?? 0} traits</div>
                <div className={styles.stats}>{p.units?.length ?? 0} units · {mins}m</div>
              </div>
              <div className={styles.side}>
                <div className={`${styles.result} ${isTop4 ? styles.win : styles.loss}`}>
                  {isTop4 ? "TOP 4" : "BOT 4"}
                </div>
                <div className={styles.time}>{formatAgo(match.info?.game_datetime)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}