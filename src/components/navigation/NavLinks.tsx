"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords, Trophy, Activity, Sparkles } from "lucide-react";

export const NAV_ITEMS = [
  { label: "Champions", href: "/champions", icon: Swords },
  { label: "Leaderboards", href: "/leaderboards", icon: Trophy },
  { label: "Live Match", href: "/live", icon: Activity },
  { label: "AI Builds", href: "/builds", icon: Sparkles, badge: "NEW" },
];

export default function NavLinks({ mobile = false, onItemClick }: { mobile?: boolean; onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className={mobile ? "flex flex-col gap-1 w-full" : "hidden md:flex items-center gap-1"}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
              isActive
                ? "text-[#C4A15B] bg-[#C4A15B]/10 border border-[#C4A15B]/30"
                : "text-[#A0A8B6] hover:text-[#F0E6D2] hover:bg-[#181E26]"
            } ${mobile ? "px-4 py-2.5 text-base" : ""}`}
          >
            <Icon className={`w-4 h-4 ${isActive ? "text-[#C4A15B]" : "text-[#A0A8B6]"}`} />
            <span>{item.label}</span>
            {item.badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#C4A15B]/20 text-[#C4A15B] border border-[#C4A15B]/40 uppercase tracking-wider">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

