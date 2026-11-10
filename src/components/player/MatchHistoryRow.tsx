"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Match, MatchParticipant } from "@/lib/types";
import {
  champIconUrl,
  itemIconUrl,
  spellIconUrl,
  SUMMONER_SPELLS,
  formatAgo,
  QUEUE_LABELS,
} from "@/lib/client";
import MatchDetailsExpanded from "./MatchDetailsExpanded";
import { ChevronDown, ChevronUp } from "lucide-react";

interface MatchHistoryRowProps {
  match: Match;
  participant: MatchParticipant;
  currentPuuid?: string;
  platform?: string;
  defaultExpanded?: boolean;
}

export default function MatchHistoryRow({
  match,
  participant: p,
  currentPuuid,
  platform = "na1",
  defaultExpanded = false,
}: MatchHistoryRowProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  const win = p.win;
  const champ = p.championName || "Unknown";
  const cs = (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
  const durationSecs = match.info?.gameDuration || 0;
  const mins = Math.floor(durationSecs / 60);
  const secs = durationSecs % 60;
  const csPerMin = mins > 0 ? (cs / mins).toFixed(1) : "0.0";
  const queueLabel = QUEUE_LABELS[match.info?.queueId] || "Game";
  const kdaRatio =
    p.deaths > 0
      ? ((p.kills + p.assists) / p.deaths).toFixed(2)
      : "Perfect";
  const dmg = p.totalDamageDealtToChampions || 0;

  // Spells
  const spell1 = p.summoner1Id ? SUMMONER_SPELLS[p.summoner1Id] : null;
  const spell2 = p.summoner2Id ? SUMMONER_SPELLS[p.summoner2Id] : null;

  // Items (6 items + trinket)
  const mainItems = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5];
  const trinket = p.item6;

  // 10 participants split into two teams (Blue 100 / Red 200)
  const participants = match.info?.participants || [];
  const blueTeam = participants.filter((x) => x.teamId === 100);
  const redTeam = participants.filter((x) => x.teamId === 200);
  const team1 = blueTeam.length > 0 ? blueTeam : participants.slice(0, 5);
  const team2 = redTeam.length > 0 ? redTeam : participants.slice(5, 10);

  // Kill participation calculation
  const playerTeam = p.teamId || (participants.indexOf(p) < 5 ? 100 : 200);
  const teamTotalKills = participants
    .filter((x) => (x.teamId || (participants.indexOf(x) < 5 ? 100 : 200)) === playerTeam)
    .reduce((s, x) => s + x.kills, 0);
  const killParticipation =
    teamTotalKills > 0
      ? Math.round(((p.kills + p.assists) / teamTotalKills) * 100)
      : 0;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        win
          ? "bg-[#181E26] border-[#4B99C2]/30 hover:border-[#4B99C2]/60"
          : "bg-[#181E26] border-[#E84057]/30 hover:border-[#E84057]/60"
      }`}
    >
      {/* Collapsed Main Row (Clickable) */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex flex-col md:flex-row items-stretch cursor-pointer select-none"
      >
        {/* Left Edge Accent Bar */}
        <div
          className={`w-full md:w-1.5 h-1 md:h-auto shrink-0 ${
            win ? "bg-[#4B99C2]" : "bg-[#E84057]"
          }`}
        />

        <div className="flex-1 p-3.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
          {/* Section 1: Queue, Time & Outcome */}
          <div className="flex flex-col min-w-[90px]">
            <span
              className={`text-xs font-black uppercase tracking-wider ${
                win ? "text-[#4B99C2]" : "text-[#E84057]"
              }`}
            >
              {win ? "Victory" : "Defeat"}
            </span>
            <span className="text-[11px] font-semibold text-[#F0E6D2] truncate">
              {queueLabel}
            </span>
            <span className="text-[10px] text-[#A0A8B6] font-mono mt-0.5">
              {formatAgo(match.info?.gameStartTimestamp)}
            </span>
            <span className="text-[10px] text-[#A0A8B6] font-mono">
              {mins}m {secs}s
            </span>
          </div>

          {/* Section 2: Champion Icon + Spells + Level */}
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <Image
                src={champIconUrl(champ)}
                alt={champ}
                width={50}
                height={50}
                className="rounded-lg border border-[#232B36] object-cover"
                unoptimized
              />
              <span className="absolute -bottom-1 -right-1 bg-[#0E1217] border border-[#232B36] text-[10px] font-mono px-1 rounded text-[#F0E6D2]">
                {p.champLevel || 1}
              </span>
            </div>

            {/* Spells */}
            <div className="flex flex-col gap-1 shrink-0">
              {spell1 ? (
                <Image
                  src={spellIconUrl(spell1)}
                  alt="Spell 1"
                  width={22}
                  height={22}
                  className="rounded border border-[#232B36]"
                  unoptimized
                />
              ) : (
                <div className="w-[22px] h-[22px] bg-[#232B36] rounded" />
              )}
              {spell2 ? (
                <Image
                  src={spellIconUrl(spell2)}
                  alt="Spell 2"
                  width={22}
                  height={22}
                  className="rounded border border-[#232B36]"
                  unoptimized
                />
              ) : (
                <div className="w-[22px] h-[22px] bg-[#232B36] rounded" />
              )}
            </div>
          </div>

          {/* Section 3: KDA & Kill Participation */}
          <div className="flex flex-col min-w-[110px]">
            <div className="text-base font-black font-mono tracking-tight text-[#F0E6D2]">
              <span className="text-[#F0E6D2]">{p.kills}</span>
              <span className="text-[#A0A8B6] font-normal mx-0.5">/</span>
              <span className="text-[#E84057]">{p.deaths}</span>
              <span className="text-[#A0A8B6] font-normal mx-0.5">/</span>
              <span className="text-[#F0E6D2]">{p.assists}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold text-[#C4A15B] font-mono">
                {kdaRatio}:1
              </span>
              <span className="text-[10px] text-[#A0A8B6] font-mono">
                ({killParticipation}% P/Kill)
              </span>
            </div>
            {/* Multi-kill tags */}
            <div className="flex items-center gap-1 mt-1">
              {p.pentaKills ? (
                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-[#C4A15B] text-[#0E1217]">
                  PENTAKILL
                </span>
              ) : p.quadraKills ? (
                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-[#C4A15B]/80 text-[#0E1217]">
                  QUADRAKILL
                </span>
              ) : p.tripleKills ? (
                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-[#C4A15B]/60 text-[#0E1217]">
                  TRIPLEKILL
                </span>
              ) : null}
            </div>
          </div>

          {/* Section 4: Damage & CS & Vision */}
          <div className="flex flex-col text-[11px] text-[#A0A8B6] font-mono min-w-[100px]">
            <div className="flex items-center gap-1 text-[#F0E6D2] font-semibold">
              <span className="text-[#E84057]">⚔️</span>
              <span>{Math.round(dmg / 1000)}k dmg</span>
            </div>
            <div className="mt-0.5">
              {cs} CS ({csPerMin}/m)
            </div>
            <div className="text-[10px]">
              Vision: {p.visionScore || 0}
            </div>
          </div>

          {/* Section 5: Items Grid (6 items + trinket) */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="grid grid-cols-3 gap-1">
              {mainItems.map((id, i) =>
                id && id > 0 ? (
                  <Image
                    key={i}
                    src={itemIconUrl(id)}
                    alt="item"
                    width={24}
                    height={24}
                    className="rounded bg-[#12161D] border border-[#232B36]"
                    unoptimized
                  />
                ) : (
                  <div
                    key={i}
                    className="w-6 h-6 rounded bg-[#12161D]/70 border border-[#232B36]/60"
                  />
                )
              )}
            </div>
            {/* Trinket / Ward Slot */}
            <div className="pl-1 border-l border-[#232B36]">
              {trinket && trinket > 0 ? (
                <Image
                  src={itemIconUrl(trinket)}
                  alt="trinket"
                  width={24}
                  height={24}
                  className="rounded-full bg-[#12161D] border border-[#232B36]"
                  unoptimized
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#12161D]/70 border border-[#232B36]/60" />
              )}
            </div>
          </div>

          {/* Section 6: Mini 5v5 Participants List */}
          <div className="hidden xl:flex items-center gap-3 shrink-0">
            {/* Team 1 (Blue) */}
            <div className="flex flex-col gap-1 w-[90px]">
              {team1.map((tp, idx) => (
                <div
                  key={tp.puuid || idx}
                  className="flex items-center gap-1.5 overflow-hidden"
                >
                  <Image
                    src={champIconUrl(tp.championName || "Unknown")}
                    alt={tp.championName || ""}
                    width={15}
                    height={15}
                    className="rounded shrink-0"
                    unoptimized
                  />
                  <Link
                    href={`/player/${platform}/${encodeURIComponent(
                      tp.riotIdGameName || tp.summonerName || ""
                    )}-${encodeURIComponent(tp.riotIdTagline || platform)}?game=lol`}
                    onClick={(e) => e.stopPropagation()}
                    className={`text-[10px] truncate hover:text-[#C4A15B] transition-colors ${
                      tp.puuid === currentPuuid
                        ? "text-[#4B99C2] font-bold"
                        : "text-[#A0A8B6]"
                    }`}
                  >
                    {tp.riotIdGameName || tp.summonerName || "Player"}
                  </Link>
                </div>
              ))}
            </div>

            {/* Team 2 (Red) */}
            <div className="flex flex-col gap-1 w-[90px]">
              {team2.map((tp, idx) => (
                <div
                  key={tp.puuid || idx}
                  className="flex items-center gap-1.5 overflow-hidden"
                >
                  <Image
                    src={champIconUrl(tp.championName || "Unknown")}
                    alt={tp.championName || ""}
                    width={15}
                    height={15}
                    className="rounded shrink-0"
                    unoptimized
                  />
                  <Link
                    href={`/player/${platform}/${encodeURIComponent(
                      tp.riotIdGameName || tp.summonerName || ""
                    )}-${encodeURIComponent(tp.riotIdTagline || platform)}?game=lol`}
                    onClick={(e) => e.stopPropagation()}
                    className={`text-[10px] truncate hover:text-[#C4A15B] transition-colors ${
                      tp.puuid === currentPuuid
                        ? "text-[#4B99C2] font-bold"
                        : "text-[#A0A8B6]"
                    }`}
                  >
                    {tp.riotIdGameName || tp.summonerName || "Player"}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7: Expand Chevron Button */}
          <div className="flex items-center justify-center p-1 rounded-md text-[#A0A8B6] hover:text-[#F0E6D2] hover:bg-[#232B36] transition-colors">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {/* Expanded Accordion Drawer */}
      {isOpen && (
        <div className="w-full animate-in fade-in slide-in-from-top-1 duration-200">
          <MatchDetailsExpanded
            match={match}
            currentPuuid={currentPuuid}
            platform={platform}
          />
        </div>
      )}
    </div>
  );
}

