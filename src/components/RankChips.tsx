import { RankEntry } from "@/lib/types";
import { TIER_ICONS } from "@/lib/client";
import styles from "./RankChips.module.css";

interface Props {
  entries: (RankEntry | null)[];
  labels: string[];
}

export default function RankChips({ entries, labels }: Props) {
  return (
    <div className={styles.chips}>
      {entries.map((entry, i) => {
        const tier = entry?.tier || "UNRANKED";
        const rank = entry?.rank || "";
        const lp = entry?.leaguePoints !== undefined ? `${entry.leaguePoints} LP` : "";
        const wins = entry?.wins || 0;
        const losses = entry?.losses || 0;
        const wr = wins + losses > 0 ? `${Math.round(wins / (wins + losses) * 100)}% WR` : "";

        return (
          <div key={i} className={styles.chip}>
            <div className={styles.icon}>{TIER_ICONS[tier] || "—"}</div>
            <div className={styles.info}>
              <span className={styles.queue}>{labels[i]}</span>
              <span className={`${styles.tier} tier-${tier.toLowerCase()}`}>{tier} {rank}</span>
              <span className={styles.lp}>{lp}{lp && wr ? " · " : ""}{wr}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}