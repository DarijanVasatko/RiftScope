import { LiveGame } from "@/lib/types";
import styles from "./LiveGamePanel.module.css";

interface Props {
  liveGame: LiveGame | null;
  puuid: string;
}

export default function LiveGamePanel({ liveGame, puuid }: Props) {
  const team1 = liveGame?.participants?.filter(p => p.teamId === 100) ?? [];
  const team2 = liveGame?.participants?.filter(p => p.teamId === 200) ?? [];
  const duration = liveGame?.gameLength
    ? `${Math.floor(liveGame.gameLength / 60)}m ${liveGame.gameLength % 60}s`
    : null;

  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>Live Game</div>
        <div className={styles.sectionLine} />
      </div>

      {!liveGame || !liveGame.participants ? (
        <div className={styles.notInGame}>Not currently in a game.</div>
      ) : (
        <>
          <div className={styles.meta}>
            <span className={styles.liveBadge}>
              <span className={styles.liveDot} />
              LIVE{duration ? ` · ${duration}` : ""}
            </span>
            {liveGame.gameMode && (
              <span className={styles.gameMode}>{liveGame.gameMode}</span>
            )}
          </div>

          <div className={styles.teams}>
            <div className={styles.teamList}>
              {team1.map((p, i) => (
                <div key={i} className={`${styles.player} ${p.puuid === puuid ? styles.highlight : ""}`}>
                  <div className={styles.champIcon}>#{p.championId}</div>
                  <div>
                    <div className={styles.playerName}>{p.summonerName || p.riotId || "Player"}</div>
                    {p.rank && <div className={styles.playerRank}>{p.rank}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.vs}>VS</div>
            <div className={styles.teamList}>
              {team2.map((p, i) => (
                <div key={i} className={`${styles.player} ${p.puuid === puuid ? styles.highlight : ""}`}>
                  <div className={styles.champIcon}>#{p.championId}</div>
                  <div>
                    <div className={styles.playerName}>{p.summonerName || p.riotId || "Player"}</div>
                    {p.rank && <div className={styles.playerRank}>{p.rank}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}