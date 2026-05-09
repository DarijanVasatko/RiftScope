import { Suspense } from "react";
import PlayerPageClient from "@/components/PlayerPageClient";

interface Props {
  params: Promise<{ platform: string; slug: string }>;
  searchParams: Promise<{ game?: string }>;
}

export default async function PlayerPage({ params, searchParams }: Props) {
  const { platform, slug } = await params;
  const { game } = await searchParams;

  const dashIdx = slug.lastIndexOf("-");
  const gameName = decodeURIComponent(slug.slice(0, dashIdx));
  const tagLine = decodeURIComponent(slug.slice(dashIdx + 1));

  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontFamily: "monospace" }}>Loading...</div>}>
      <PlayerPageClient
        gameName={gameName}
        tagLine={tagLine}
        platform={platform}
        game={(game as "lol" | "val" | "tft") || "lol"}
      />
    </Suspense>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ platform: string; slug: string }> }) {
  const { slug, platform } = await params;
  const dashIdx = slug.lastIndexOf("-");
  const gameName = decodeURIComponent(slug.slice(0, dashIdx));
  const tagLine = decodeURIComponent(slug.slice(dashIdx + 1));
  return {
    title: `${gameName}#${tagLine} — RiftScope`,
    description: `View ${gameName}#${tagLine}'s profile, rank, match history and stats on ${platform.toUpperCase()}.`,
  };
}