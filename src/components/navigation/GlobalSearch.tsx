"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Sparkles, X, User } from "lucide-react";
import { REGION_DISPLAY_NAMES, LOL_PLATFORMS, playerUrl, champIconUrl } from "@/lib/client";

interface AutocompleteItem {
  type: "player" | "champion";
  name: string;
  tag?: string;
  subtitle: string;
  platform?: string;
  icon?: string;
}

const MOCK_SUGGESTIONS: AutocompleteItem[] = [
  { type: "player", name: "Faker", tag: "T1", subtitle: "Challenger 980 LP · LCK", platform: "kr" },
  { type: "player", name: "Chovy", tag: "GEN", subtitle: "Challenger 1,420 LP · LCK", platform: "kr" },
  { type: "player", name: "Caps", tag: "G2", subtitle: "Grandmaster 650 LP · LEC", platform: "euw1" },
  { type: "champion", name: "Jinx", subtitle: "The Loose Cannon · Tier S ADC", icon: champIconUrl("Jinx") },
  { type: "champion", name: "Viktor", subtitle: "The Machine Herald · Tier A Mid", icon: champIconUrl("Viktor") },
  { type: "champion", name: "Jayce", subtitle: "The Defender of Tomorrow · Tier A Top", icon: champIconUrl("Jayce") },
];

export default function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("na1");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut ('/' or 'Cmd+K' to focus)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSuggestions = query.trim()
    ? MOCK_SUGGESTIONS.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.tag && item.tag.toLowerCase().includes(query.toLowerCase()))
      )
    : MOCK_SUGGESTIONS.slice(0, 4);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    let gameName = trimmed;
    let tagLine = "NA1";

    if (trimmed.includes("#")) {
      const parts = trimmed.split("#");
      gameName = parts[0].trim();
      tagLine = parts.slice(1).join("#").trim();
    } else {
      // Default tag based on platform if omitted
      tagLine = (REGION_DISPLAY_NAMES[platform] || platform).toUpperCase();
    }

    setIsOpen(false);
    inputRef.current?.blur();
    router.push(playerUrl(gameName, tagLine, platform, "lol"));
  };

  const handleSelect = (item: AutocompleteItem) => {
    if (item.type === "player") {
      router.push(playerUrl(item.name, item.tag || "NA1", item.platform || platform, "lol"));
    } else {
      setQuery(item.name);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${compact ? "max-w-xs" : "max-w-md lg:max-w-lg"}`}>
      <form
        onSubmit={handleSubmit}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 bg-[#181E26]/90 backdrop-blur-md ${
          isFocused
            ? "border-[#C4A15B] shadow-[0_0_18px_rgba(196,161,91,0.22)] ring-1 ring-[#C4A15B]/40"
            : "border-[#232B36] hover:border-[#232B36]/80"
        }`}
      >
        <Search className="w-4 h-4 text-[#C4A15B] shrink-0" />

        {/* Region selector badge */}
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="bg-[#0E1217] text-[#C4A15B] text-xs font-semibold px-2 py-0.5 rounded border border-[#232B36] focus:outline-none focus:border-[#C4A15B] cursor-pointer"
        >
          {LOL_PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {REGION_DISPLAY_NAMES[p] || p.toUpperCase()}
            </option>
          ))}
        </select>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          placeholder="Search Summoner (e.g. Faker#T1) or champion..."
          className="w-full bg-transparent text-sm text-[#F0E6D2] placeholder-[#A0A8B6]/60 focus:outline-none"
        />

        {/* Clear query button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="text-[#A0A8B6] hover:text-[#F0E6D2] p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Keyboard shortcut hint */}
        {!query && (
          <kbd className="hidden sm:inline-flex items-center text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border border-[#232B36] text-[#A0A8B6] bg-[#0E1217]">
            /
          </kbd>
        )}
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-[#232B36] bg-[#181E26]/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-2 border-b border-[#232B36] flex items-center justify-between text-[11px] font-semibold text-[#A0A8B6] uppercase tracking-wider px-3">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#C4A15B]" />
              {query ? "Matching Results" : "Trending Players & Champions"}
            </span>
            <span className="text-[10px] text-[#A0A8B6]/70">Enter ↵ to search</span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-[#232B36]/50">
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={() => handleSelect(item)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-[#232B36]/60 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {item.type === "champion" && item.icon ? (
                      <Image
                        src={item.icon}
                        alt={item.name}
                        width={28}
                        height={28}
                        className="rounded-md border border-[#232B36] group-hover:border-[#C4A15B] transition-colors"
                        unoptimized
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-[#0E1217] border border-[#232B36] flex items-center justify-center text-[#C4A15B] group-hover:border-[#C4A15B] transition-colors">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-[#F0E6D2] group-hover:text-[#C4A15B] transition-colors flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.tag && <span className="text-xs text-[#A0A8B6]">#{item.tag}</span>}
                      </div>
                      <div className="text-[11px] text-[#A0A8B6]">{item.subtitle}</div>
                    </div>
                  </div>

                  {item.platform && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0E1217] border border-[#232B36] text-[#4B99C2]">
                      {REGION_DISPLAY_NAMES[item.platform] || item.platform.toUpperCase()}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-[#A0A8B6]">
                Press <span className="text-[#F0E6D2] font-semibold">Enter ↵</span> to search for &ldquo;{query}&rdquo; on {REGION_DISPLAY_NAMES[platform] || platform.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
