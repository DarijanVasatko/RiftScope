"use client";

import React, { createContext, useContext, useState } from "react";

export interface User {
  id: string;
  name: string;
  tag: string;
  avatarUrl?: string;
  provider?: "riot" | "discord" | "google";
}

interface AuthContextType {
  user: User | null;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithProvider: (provider: "riot" | "discord" | "google") => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const loginWithProvider = async (provider: "riot" | "discord" | "google") => {
    // Auth shell: Simulated OAuth handshake for Phase 1
    const mockUser: User = {
      id: "u_hextech_1",
      name: provider === "riot" ? "ArcanePiltover" : "HextechInnovator",
      tag: "PILTO",
      avatarUrl: "https://ddragon.leagueoflegends.com/cdn/16.8.1/img/profileicon/588.png",
      provider,
    };
    setUser(mockUser);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        loginWithProvider,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

