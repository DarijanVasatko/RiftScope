"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Match, MatchParticipant } from "@/lib/types";
import { champIconUrl, itemIconUrl, formatNumber } from "@/lib/client";
import TeamScoreboard from "./TeamScoreboard";

interface MatchDetailsExpandedProps {
  match: Match;
  currentPuuid?: string;
  platform?: string;
}

type TabType = "Post Game" | "Performance" | "Item Build" | "Timeline" | "Metrics";

export default function MatchDetailsExpanded({
  match,
  currentPuuid,
  platform = "na1",
}: MatchDetailsExpandedProps) {
  const [activeTab, setActiveTab] = useState<TabType>("Post Game");

  const participants = match.info?.participants || [];
  const duration = match.info?.gameDuration || 1;

  // Split participants by team
  const blueTeam = participants.filter((p) => p.teamId === 100);
  const redTeam = participants.filter((p) => p.teamId === 200);

  // If teams are missing explicit 100/200, split in half
  const team1 = blueTeam.length > 0 ? blueTeam : participants.slice(0, 5);
  const team2 = redTeam.length > 0 ? redTeam : participants.slice(5, 10);

  const team1Obj = match.info?.teams?.find((t) => t.teamId === 100);
  const team2Obj = match.info?.teams?.find((t) => t.teamId === 200);

  const team1Win = team1Obj ? team1Obj.win : (team1[0]?.win ?? false);
  const team2Win = team2Obj ? team2Obj.win : (team2[0]?.win ?? false);

  // Calculate highest damage for normalized bars
  const maxDamage = Math.max(
    ...participants.map((p) => p.totalDamageDealtToChampions || 0),
    1
  );

  // Determine MVP (best score on winning team) & ACE (best score on losing team)
  function getScore(p: MatchParticipant) {
    return (p.kills * 2) + p.assists - (p.deaths * 1.5) + ((p.totalDamageDealtToChampions || 0) / 1000);
  }

  const winningTeam = team1Win ? team1 : team2;
  const losingTeam = team1Win ? team2 : team1;

  const mvpParticipant = [...winningTeam].sort((a, b) => getScore(b) - getScore(a))[0];
  const aceParticipant = [...losingTeam].sort((a, b) => getScore(b) - getScore(a))[0];

  const tabs: TabType[] = ["Post Game", "Performance", "Item Build", "Timeline", "Metrics"];

  return (
    <div className="w-full bg-[#11151C] border-t border-[#232B36] p-4 flex flex-col gap-4 text-[#F0E6D2]">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 bg-[#181E26] p-1 rounded-lg border border-[#232B36] w-fit">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(tab);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                isActive
                  ? "bg-[#C4A15B] text-[#0E1217] shadow-sm font-bold"
                  : "text-[#A0A8B6] hover:text-[#F0E6D2] hover:bg-[#232B36]/50"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Post Game Scoreboards */}
      {activeTab === "Post Game" && (
        <div className="flex flex-col gap-4">
          <TeamScoreboard
            teamName="Blue Team"
            win={team1Win}
            participants={team1}
            currentPuuid={currentPuuid}
            gameDurationSeconds={duration}
            maxDamageInMatch={maxDamage}
            objectives={team1Obj?.objectives}
            mvpPuuid={mvpParticipant?.puuid}
            acePuuid={aceParticipant?.puuid}
            platform={platform}
          />

          <TeamScoreboard
            teamName="Red Team"
            win={team2Win}
            participants={team2}
            currentPuuid={currentPuuid}
            gameDurationSeconds={duration}
            maxDamageInMatch={maxDamage}
            objectives={team2Obj?.objectives}
            mvpPuuid={mvpParticipant?.puuid}
            acePuuid={aceParticipant?.puuid}
            platform={platform}
          />
        </div>
      )}

      {/* Tab 2: Performance (Damage distribution & Mitigated) */}
      {activeTab === "Performance" && (
        <div className="bg-[#181E26] rounded-lg border border-[#232B36] p-4 flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#C4A15B]">
            Damage & Defense Breakdown
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[team1, team2].map((team, tIdx) => (
              <div key={tIdx} className="flex flex-col gap-2">
                <div className="text-xs font-bold text-[#A0A8B6] border-b border-[#232B36] pb-1">
                  {tIdx === 0 ? "Blue Team" : "Red Team"}
                </div>
                {team.map((p) => {
                  const champ = p.championName || "Unknown";
                  const physical = p.physicalDamageDealtToChampions || 0;
                  const magic = p.magicDamageDealtToChampions || 0;
                  const trueDmg = p.trueDamageDealtToChampions || 0;
                  const total = physical + magic + trueDmg || 1;

                  return (
                    <div key={p.puuid} className="flex items-center gap-3 p-2 bg-[#12161D] rounded border border-[#232B36]/60">
                      <Image
                        src={champIconUrl(champ)}
                        alt={champ}
                        width={28}
                        height={28}
                        className="rounded shrink-0"
                        unoptimized
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold truncate">{p.riotIdGameName || p.summonerName}</span>
                          <span className="font-mono text-[11px] text-[#A0A8B6]">{total.toLocaleString()} dmg</span>
                        </div>
                        {/* Segmented Damage Bar */}
                        <div className="h-1.5 w-full bg-[#232B36] rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${(physical / total) * 100}%` }}
                            className="bg-[#E84057] h-full"
                            title={`Physical: ${physical.toLocaleString()}`}
                          />
                          <div
                            style={{ width: `${(magic / total) * 100}%` }}
                            className="bg-[#4B99C2] h-full"
                            title={`Magic: ${magic.toLocaleString()}`}
                          />
                          <div
                            style={{ width: `${(trueDmg / total) * 100}%` }}
                            className="bg-[#F0E6D2] h-full"
                            title={`True: ${trueDmg.toLocaleString()}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-4 text-[11px] text-[#A0A8B6]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#E84057]" /> Physical</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#4B99C2]" /> Magic</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#F0E6D2]" /> True</span>
          </div>
        </div>
      )}

      {/* Tab 3: Item Build Overview */}
      {activeTab === "Item Build" && (
        <div className="bg-[#181E26] rounded-lg border border-[#232B36] p-4 flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#C4A15B]">
            Final Inventories & Gold Efficiency
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {participants.map((p) => {
              const items = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6];
              return (
                <div key={p.puuid} className="flex items-center justify-between p-2.5 bg-[#12161D] rounded border border-[#232B36]">
                  <div className="flex items-center gap-2">
                    <Image
                      src={champIconUrl(p.championName || "Unknown")}
                      alt="Champ"
                      width={30}
                      height={30}
                      className="rounded"
                      unoptimized
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{p.riotIdGameName || p.summonerName}</span>
                      <span className="text-[10px] text-[#C4A15B] font-mono">🪙 {formatNumber(p.goldEarned || 0)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {items.map((it, idx) => (
                      it && it > 0 ? (
                        <Image
                          key={idx}
                          src={itemIconUrl(it)}
                          alt="item"
                          width={22}
                          height={22}
                          className="rounded border border-[#232B36]"
                          unoptimized
                        />
                      ) : (
                        <div key={idx} className="w-[22px] h-[22px] rounded bg-[#232B36]/40 border border-[#232B36]" />
                      )
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Timeline */}
      {activeTab === "Timeline" && (
        <div className="bg-[#181E26] rounded-lg border border-[#232B36] p-4 flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#C4A15B]">
            Game Flow & Milestones
          </h4>
          <div className="flex flex-col gap-2 text-xs text-[#A0A8B6]">
            <div className="flex items-center justify-between p-2 bg-[#12161D] rounded border border-[#232B36]">
              <span>Game Duration</span>
              <span className="font-mono text-[#F0E6D2]">
                {Math.floor(duration / 60)}m {duration % 60}s
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#12161D] rounded border border-[#232B36]">
              <span>Game Mode</span>
              <span className="font-mono text-[#F0E6D2]">{match.info?.gameMode || "Classic"}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#12161D] rounded border border-[#232B36]">
              <span>Game Version</span>
              <span className="font-mono text-[#F0E6D2]">{match.info?.gameVersion || "Latest"}</span>
            </div>
            <div className="p-3 bg-[#12161D] rounded border border-[#232B36] text-[11px] leading-relaxed">
              💡 Complete minute-by-minute frame telemetry will sync when Riot Timeline API integration is connected.
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Metrics (CS/min & Vision Score) */}
      {activeTab === "Metrics" && (
        <div className="bg-[#181E26] rounded-lg border border-[#232B36] p-4 flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#C4A15B]">
            Vision & Farming Radar
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex flex-col gap-2 p-3 bg-[#12161D] rounded border border-[#232B36]">
              <span className="font-bold text-[#4B99C2]">Top Vision Scores</span>
              {[...participants].sort((a, b) => (b.visionScore || 0) - (a.visionScore || 0)).slice(0, 3).map((p, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span>{p.riotIdGameName || p.summonerName} ({p.championName})</span>
                  <span className="font-mono font-bold text-[#F0E6D2]">{p.visionScore || 0} pts</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 p-3 bg-[#12161D] rounded border border-[#232B36]">
              <span className="font-bold text-[#C4A15B]">Top CS/Min</span>
              {[...participants].sort((a, b) => {
                const csA = (a.totalMinionsKilled || 0) + (a.neutralMinionsKilled || 0);
                const csB = (b.totalMinionsKilled || 0) + (b.neutralMinionsKilled || 0);
                return csB - csA;
              }).slice(0, 3).map((p, idx) => {
                const cs = (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
                const csMin = (cs / (duration / 60)).toFixed(1);
                return (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span>{p.riotIdGameName || p.summonerName} ({p.championName})</span>
                    <span className="font-mono font-bold text-[#F0E6D2]">{cs} ({csMin}/m)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

