export type Game = "lol" | "val" | "tft";

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface Summoner {
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
  name: string;
  encryptedSummonerId?: string;
}

export interface RankEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface MatchParticipant {
  puuid: string;
  summonerName?: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  championName?: string;
  champLevel?: number;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  totalMinionsKilled?: number;
  neutralMinionsKilled?: number;
  teamId?: number;
  totalDamageDealtToChampions?: number;
  goldEarned?: number;
  visionScore?: number;
  item0?: number;
  item1?: number;
  item2?: number;
  item3?: number;
  item4?: number;
  item5?: number;
  item6?: number;
  summoner1Id?: number;
  summoner2Id?: number;
  perks?: {
    styles?: Array<{
      description: string;
      selections: Array<{ perk: number }>;
    }>;
  };
  teamPosition?: string;
  doubleKills?: number;
  tripleKills?: number;
  quadraKills?: number;
  pentaKills?: number;
  wardsPlaced?: number;
  wardsKilled?: number;
  firstBloodKill?: boolean;
}

export interface MatchInfo {
  gameStartTimestamp: number;
  gameDuration: number;
  queueId: number;
  gameMode?: string;
  gameVersion?: string;
  participants: MatchParticipant[];
  teams?: Array<{
    teamId: number;
    win: boolean;
    objectives?: {
      baron?: { kills: number };
      dragon?: { kills: number };
      tower?: { kills: number };
    };
  }>;
}

export interface Match {
  metadata: { matchId: string };
  info: MatchInfo;
}

export interface LiveParticipant {
  puuid?: string;
  summonerName?: string;
  riotId?: string;
  championId: number;
  teamId: number;
  rank?: string;
}

export interface LiveGame {
  gameMode?: string;
  gameLength?: number;
  participants: LiveParticipant[];
}

export interface TFTParticipant {
  puuid: string;
  placement: number;
  level?: number;
  traits?: unknown[];
  units?: unknown[];
}

export interface TFTMatchInfo {
  game_datetime?: number;
  game_length?: number;
  participants: TFTParticipant[];
}

export interface TFTMatch {
  metadata: { match_id: string };
  info: TFTMatchInfo;
}

export interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  chestGranted: boolean;
  tokensEarned: number;
}

export interface SearchHistoryEntry {
  gameName: string;
  tagLine: string;
  platform: string;
  game: Game;
  timestamp: number;
}

export interface WinLossStat {
  date: string;
  wins: number;
  losses: number;
  wr: number;
}