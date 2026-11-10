"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MatchParticipant } from "@/lib/types";
import {
  champIconUrl,
  itemIconUrl,
  spellIconUrl,
  SUMMONER_SPELLS,
  formatNumber,
} from "@/lib/client";

interface TeamScoreboardProps {
  teamName: string; // e.g. "Blue Team" or "Red Team"
  win: boolean;
  participants: MatchParticipant[];
  currentPuuid?: string;
  gameDurationSeconds: number;
  maxDamageInMatch: number;
  objectives?: {
    baron?: { kills: number };
    dragon?: { kills: number };
    tower?: { kills: number };
    inhibitor?: { kills: number };
    riftHerald?: { kills: number };
  };
  mvpPuuid?: string;
  acePuuid?: string;
  platform?: string;
}

export default function TeamScoreboard({
  teamName,
  win,
  participants,
  currentPuuid,
  gameDurationSeconds,
  maxDamageInMatch,
  objectives,
  mvpPuuid,
  acePuuid,
  platform = "na1",
}: TeamScoreboardProps) {
  const totalKills = participants.reduce((s, p) => s + p.kills, 0);
  const totalDeaths = participants.reduce((s, p) => s + p.deaths, 0);
  const totalAssists = participants.reduce((s, p) => s + p.assists, 0);
  const totalGold = participants.reduce((s, p) => s + (p.goldEarned || 0), 0);

  const durationMin = Math.max(1, gameDurationSeconds / 60);

  return (
    <div className="flex flex-col w-full overflow-hidden rounded-lg border border-[#232B36] bg-[#181E26]">
      {/* Team Header Bar */}
      <div
        className={`flex items-center justify-between px-3.5 py-2.5 border-b text-xs font-semibold ${
          win
            ? "bg-[#4B99C2]/10 border-[#4B99C2]/30 text-[#4B99C2]"
            : "bg-[#E84057]/10 border-[#E84057]/30 text-[#E84057]"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-extrabold uppercase tracking-wider text-sm">
            {win ? "Victory" : "Defeat"}
          </span>
          <span className="text-[#A0A8B6] font-normal">({teamName})</span>
          <span className="text-[#F0E6D2] font-mono ml-2 font-bold">
            {totalKills} / {totalDeaths} / {totalAssists}
          </span>
        </div>

        {/* Objectives & Gold */}
        <div className="flex items-center gap-3 sm:gap-4 text-[#A0A8B6] text-[11px] font-mono">
          <div className="hidden sm:flex items-center gap-1 text-[#F0E6D2]">
            <span className="text-[#C4A15B]">🪙</span>
            <span>{formatNumber(totalGold)}</span>
          </div>
          {objectives && (
            <div className="flex items-center gap-2 text-xs">
              <span title="Baron Kills">🦁 {objectives.baron?.kills || 0}</span>
              <span title="Dragon Kills">🐉 {objectives.dragon?.kills || 0}</span>
              <span title="Tower Kills">🏰 {objectives.tower?.kills || 0}</span>
              {objectives.inhibitor && (
                <span title="Inhibitor Kills" className="hidden sm:inline">
                  💎 {objectives.inhibitor?.kills || 0}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table Structure */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-[#232B36] bg-[#12161D] text-[10px] uppercase font-bold text-[#A0A8B6] tracking-wider">
              <th className="py-2 px-3">Champion / Player</th>
              <th className="py-2 px-2 text-center">Badge</th>
              <th className="py-2 px-3 text-center">KDA</th>
              <th className="py-2 px-3 text-center">Damage</th>
              <th className="py-2 px-2 text-center">Gold</th>
              <th className="py-2 px-2 text-center">CS</th>
              <th className="py-2 px-2 text-center">Wards</th>
              <th className="py-2 px-3 text-right">Items</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#232B36]/60">
            {participants.map((p, idx) => {
              const isCurrentPlayer = p.puuid === currentPuuid;
              const champName = p.championName || "Unknown";
              const playerName = p.riotIdGameName || p.summonerName || "Summoner";
              const tagLine = p.riotIdTagline ? `#${p.riotIdTagline}` : "";
              const kdaRatio =
                p.deaths > 0
                  ? ((p.kills + p.assists) / p.deaths).toFixed(2)
                  : "Perfect";

              const cs =
                (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
              const csPerMin = (cs / durationMin).toFixed(1);

              const damage = p.totalDamageDealtToChampions || 0;
              const dmgPercent =
                maxDamageInMatch > 0
                  ? Math.min(100, Math.round((damage / maxDamageInMatch) * 100))
                  : 0;

              const isMvp = p.puuid === mvpPuuid;
              const isAce = p.puuid === acePuuid;

              const spell1 = p.summoner1Id ? SUMMONER_SPELLS[p.summoner1Id] : null;
              const spell2 = p.summoner2Id ? SUMMONER_SPELLS[p.summoner2Id] : null;

              const mainItems = [
                p.item0,
                p.item1,
                p.item2,
                p.item3,
                p.item4,
                p.item5,
              ];
              const trinket = p.item6;

              const wardsPlaced = p.wardsPlaced || 0;
              const wardsKilled = p.wardsKilled || 0;
              const visionScore = p.visionScore || 0;

              const rowBg = isCurrentPlayer
                ? "bg-[#4B99C2]/15 hover:bg-[#4B99C2]/20"
                : idx % 2 === 0
                ? "bg-[#181E26] hover:bg-[#202732]"
                : "bg-[#11151C] hover:bg-[#1a202a]";

              return (
                <tr
                  key={p.puuid || idx}
                  className={`transition-colors text-[#F0E6D2] ${rowBg}`}
                >
                  {/* Champion + Player Name */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2.5">
                      {/* Champion icon & level */}
                      <div className="relative shrink-0 w-9 h-9">
                        <Image
                          src={champIconUrl(champName)}
                          alt={champName}
                          width={36}
                          height={36}
                          className="rounded-md object-cover border border-[#232B36]"
                          unoptimized
                        />
                        <span className="absolute -bottom-1 -right-1 bg-[#0E1217] border border-[#232B36] text-[9px] font-mono px-1 rounded text-[#F0E6D2] leading-tight">
                          {p.champLevel || 1}
                        </span>
                      </div>

                      {/* Summoner Spells */}
                      <div className="flex flex-col gap-0.5 shrink-0">
                        {spell1 ? (
                          <Image
                            src={spellIconUrl(spell1)}
                            alt="Spell 1"
                            width={16}
                            height={16}
                            className="rounded border border-[#232B36]"
                            unoptimized
                          />
                        ) : (
                          <div className="w-4 h-4 bg-[#232B36] rounded" />
                        )}
                        {spell2 ? (
                          <Image
                            src={spellIconUrl(spell2)}
                            alt="Spell 2"
                            width={16}
                            height={16}
                            className="rounded border border-[#232B36]"
                            unoptimized
                          />
                        ) : (
                          <div className="w-4 h-4 bg-[#232B36] rounded" />
                        )}
                      </div>

                      {/* Name & Tag */}
                      <div className="flex flex-col min-w-0 max-w-[130px] sm:max-w-[160px]">
                        <Link
                          href={`/player/${platform}/${encodeURIComponent(
                            p.riotIdGameName || p.summonerName || ""
                          )}-${encodeURIComponent(p.riotIdTagline || platform)}?game=lol`}
                          className={`font-semibold text-xs truncate hover:text-[#C4A15B] transition-colors ${
                            isCurrentPlayer ? "text-[#4B99C2] font-bold" : "text-[#F0E6D2]"
                          }`}
                          title={`${playerName}${tagLine}`}
                        >
                          {playerName}
                        </Link>
                        {tagLine && (
                          <span className="text-[10px] text-[#A0A8B6] font-mono truncate">
                            {tagLine}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* MVP / ACE Badge */}
                  <td className="py-2 px-2 text-center">
                    {isMvp && (
                      <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-[#C4A15B] text-[#0E1217]">
                        MVP
                      </span>
                    )}
                    {isAce && (
                      <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-[#8A3FFC] text-white">
                        ACE
                      </span>
                    )}
                  </td>

                  {/* KDA */}
                  <td className="py-2 px-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-mono font-bold text-xs text-[#F0E6D2]">
                        {p.kills} <span className="text-[#A0A8B6]">/</span>{" "}
                        <span className="text-[#E84057]">{p.deaths}</span>{" "}
                        <span className="text-[#A0A8B6]">/</span> {p.assists}
                      </span>
                      <span className="text-[10px] font-mono text-[#A0A8B6]">
                        {kdaRatio}:1
                      </span>
                    </div>
                  </td>

                  {/* Damage & Bar */}
                  <td className="py-2 px-3 text-center min-w-[90px]">
                    <div className="flex flex-col items-center gap-1 w-full max-w-[90px] mx-auto">
                      <span className="font-mono text-xs font-semibold text-[#F0E6D2]">
                        {damage.toLocaleString()}
                      </span>
                      <div className="w-full h-1.5 bg-[#232B36] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${dmgPercent}%`,
                            backgroundColor: win ? "#4B99C2" : "#E84057",
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Gold */}
                  <td className="py-2 px-2 text-center font-mono text-xs text-[#A0A8B6]">
                    {formatNumber(p.goldEarned || 0)}
                  </td>

                  {/* CS */}
                  <td className="py-2 px-2 text-center font-mono text-xs">
                    <div className="text-[#F0E6D2] font-semibold">{cs}</div>
                    <div className="text-[10px] text-[#A0A8B6]">
                      {csPerMin}/m
                    </div>
                  </td>

                  {/* Wards */}
                  <td className="py-2 px-2 text-center font-mono text-xs" title={`Score: ${visionScore} | Placed: ${wardsPlaced} | Killed: ${wardsKilled}`}>
                    <div className="text-[#F0E6D2]">{visionScore}</div>
                    <div className="text-[10px] text-[#A0A8B6]">
                      {wardsPlaced}/{wardsKilled}
                    </div>
                  </td>

                  {/* Items Build */}
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <div className="grid grid-cols-6 gap-0.5">
                        {mainItems.map((itemId, i) =>
                          itemId && itemId > 0 ? (
                            <Image
                              key={i}
                              src={itemIconUrl(itemId)}
                              alt="Item"
                              width={22}
                              height={22}
                              className="rounded bg-[#12161D] border border-[#232B36]"
                              unoptimized
                            />
                          ) : (
                            <div
                              key={i}
                              className="w-[22px] h-[22px] rounded bg-[#12161D]/80 border border-[#232B36]/60"
                            />
                          )
                        )}
                      </div>

                      {/* Trinket */}
                      <div className="ml-1 pl-1 border-l border-[#232B36]">
                        {trinket && trinket > 0 ? (
                          <Image
                            src={itemIconUrl(trinket)}
                            alt="Trinket"
                            width={22}
                            height={22}
                            className="rounded-full bg-[#12161D] border border-[#232B36]"
                            unoptimized
                          />
                        ) : (
                          <div className="w-[22px] h-[22px] rounded-full bg-[#12161D]/80 border border-[#232B36]/60" />
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

