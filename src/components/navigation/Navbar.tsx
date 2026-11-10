"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Shield, Menu, X, LogIn, User as UserIcon, LogOut, ChevronDown } from "lucide-react";
import GlobalSearch from "./GlobalSearch";
import NavLinks from "./NavLinks";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, openAuthModal, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0E1217]/85 backdrop-blur-md border-b border-[#232B36] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Desktop Nav Links */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#181E26] to-[#0E1217] border border-[#C4A15B]/50 flex items-center justify-center shadow-[0_0_12px_rgba(196,161,91,0.2)] group-hover:border-[#C4A15B] group-hover:shadow-[0_0_18px_rgba(196,161,91,0.4)] transition-all">
              <Shield className="w-5 h-5 text-[#C4A15B] transition-transform group-hover:scale-105" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-[#F0E6D2] group-hover:text-white transition-colors">
                Rift<span className="text-[#C4A15B]">Scope</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#A0A8B6] font-mono -mt-1">
                Piltover Hextech
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <NavLinks />
        </div>

        {/* Global Summoner Search Bar */}
        <div className="hidden sm:flex flex-1 justify-center max-w-md lg:max-w-lg">
          <GlobalSearch />
        </div>

        {/* User Auth & Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg border border-[#232B36] bg-[#181E26] hover:border-[#C4A15B] transition-all cursor-pointer"
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.name}
                    width={28}
                    height={28}
                    className="rounded-full border border-[#C4A15B]/40"
                    unoptimized
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#0E1217] text-[#C4A15B] flex items-center justify-center">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="hidden md:inline text-xs font-semibold text-[#F0E6D2]">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#A0A8B6]" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-[#232B36] bg-[#181E26] shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-2 border-b border-[#232B36]">
                    <p className="text-xs font-bold text-[#F0E6D2]">{user.name}</p>
                    <p className="text-[10px] text-[#A0A8B6]">#{user.tag}</p>
                  </div>
                  <Link
                    href={`/player/na1/${encodeURIComponent(user.name)}-${encodeURIComponent(user.tag)}?game=lol`}
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#F0E6D2] hover:bg-[#232B36] hover:text-[#C4A15B] transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    My Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-[#232B36] transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-[#0E1217] bg-[#C4A15B] hover:bg-[#DFBA73] active:scale-[0.98] transition-all shadow-[0_0_12px_rgba(196,161,91,0.25)] hover:shadow-[0_0_18px_rgba(196,161,91,0.4)] cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg border border-[#232B36] text-[#A0A8B6] hover:text-[#F0E6D2] hover:bg-[#181E26] transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#232B36] bg-[#0E1217] px-4 py-4 space-y-4 animate-in slide-in-from-top duration-200">
          <GlobalSearch compact />
          <NavLinks mobile onItemClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  );
}

