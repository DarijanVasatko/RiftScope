import Image from "next/image";
import { RiotAccount, Summoner } from "@/lib/types";
import styles from "./ProfileBanner.module.css";

interface Props {
  account: RiotAccount;
  summoner: Summoner;
  iconUrl: string;
  platformLabel: string;
}

export default function ProfileBanner({ account, summoner, iconUrl, platformLabel }: Props) {
  return (
    <div className={styles.banner}>
      <div className={styles.avatarWrap}>
        <div className={styles.avatar}>
          <Image src={iconUrl} alt="profile icon" width={72} height={72} unoptimized />
        </div>
        <div className={styles.level}>{summoner.summonerLevel}</div>
      </div>
      <div className={styles.info}>
        <div className={styles.name}>
          {account.gameName}
          <span className={styles.tag}>#{account.tagLine}</span>
        </div>
        <div className={styles.meta}>
          PUUID: {account.puuid.slice(0, 14)}... · {platformLabel}
        </div>
      </div>
    </div>
  );
}