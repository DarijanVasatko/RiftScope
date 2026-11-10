"use client";

import React from "react";

interface WinRateDonutProps {
  wins: number;
  losses: number;
  kills: number | string;
  deaths: number | string;
  assists: number | string;
  size?: number;
  strokeWidth?: number;
  subtitle?: string;
  label?: string;
}

export default function WinRateDonut({
  wins,
  losses,
  kills,
  deaths,
  assists,
  size = 110,
  strokeWidth = 9,
  subtitle,
  label = "Recent Games",
}: WinRateDonutProps) {
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const numKills = Number(kills) || 0;
  const numDeaths = Number(deaths) || 0;
  const numAssists = Number(assists) || 0;
  const kdaRatio =
    numDeaths > 0
      ? ((numKills + numAssists) / numDeaths).toFixed(2)
      : (numKills + numAssists > 0 ? "Perfect" : "0.00");

  // SVG circular calculations
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const winStrokeDash = (winRate / 100) * circumference;
  const lossStrokeDash = circumference - winStrokeDash;

  return (
    <div className="flex flex-col items-center sm:items-start p-4 rounded-xl bg-[#181E26] border border-[#232B36] shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#A0A8B6] mb-3">
        {label}
      </div>

      <div className="flex items-center gap-5 w-full">
        {/* Donut Chart */}
        <div
          className="relative flex items-center justify-center shrink-0"
          style={{ width: size, height: size }}
        >
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="-rotate-90"
          >
            {/* Background / Base Ring (Loss color or muted dark) */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={total === 0 ? "#232B36" : "#E84057"}
              strokeWidth={strokeWidth}
              className="transition-all duration-500"
            />
            {/* Win Arc (Hextech Crystal Blue) */}
            {total > 0 && winRate > 0 && (
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#4B99C2"
                strokeWidth={strokeWidth}
                strokeDasharray={`${winStrokeDash} ${lossStrokeDash}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}
          </svg>

          {/* Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-1">
            <span className="text-[15px] font-black text-[#F0E6D2] tracking-tight leading-none">
              {total > 0 ? `${winRate}%` : "—"}
            </span>
            <span className="text-[9px] font-semibold text-[#A0A8B6] uppercase tracking-wider mt-0.5">
              WR
            </span>
            <span className="text-[10px] font-bold text-[#C4A15B] tracking-tight mt-1 leading-none">
              {kdaRatio}:1
            </span>
          </div>
        </div>

        {/* Stats Summary & Pills */}
        <div className="flex flex-col gap-2 flex-1">
          {/* Record text */}
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-[#A0A8B6] font-medium">Record</span>
            <span className="font-bold text-[#F0E6D2]">
              <span className="text-[#4B99C2]">{wins}W</span>
              <span className="text-[#A0A8B6] mx-1">/</span>
              <span className="text-[#E84057]">{losses}L</span>
              <span className="text-[#A0A8B6] text-[11px] ml-1.5 font-normal">
                ({total}G)
              </span>
            </span>
          </div>

          {/* KDA numbers */}
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-[#A0A8B6] font-medium">Avg KDA</span>
            <span className="font-semibold text-[#F0E6D2]">
              {kills} <span className="text-[#A0A8B6]">/</span>{" "}
              <span className="text-[#E84057] font-bold">{deaths}</span>{" "}
              <span className="text-[#A0A8B6]">/</span> {assists}
            </span>
          </div>

          {/* Subtitle / extra queue info */}
          {subtitle && (
            <div className="text-[11px] text-[#A0A8B6] truncate mt-0.5">
              {subtitle}
            </div>
          )}

          {/* Stat Pills */}
          <div className="flex flex-wrap gap-1.5 mt-1">
            <div className="px-2.5 py-1 rounded-md bg-[#12161D] border border-[#232B36] text-[11px] font-semibold text-[#F0E6D2] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4B99C2]"></span>
              <span>{winRate}% WR</span>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-[#12161D] border border-[#232B36] text-[11px] font-semibold text-[#C4A15B] flex items-center gap-1.5">
              <span>{kdaRatio} KDA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

