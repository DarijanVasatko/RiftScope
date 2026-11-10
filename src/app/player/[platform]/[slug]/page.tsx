import { Suspense } from "react";
import PlayerPageClient from "@/components/PlayerPageClient";

interface Props {
  params: Promise<{ platform: string; slug: string }>;
  searchParams: Promise<{ game?: string }>;
}

function safeDecode(val: string): string {
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

function parsePlayerSlug(rawSlug: string): { gameName: string; tagLine: string } {
  const slug = safeDecode(rawSlug);
  const dashIdx = slug.lastIndexOf("-");
  if (dashIdx <= 0) {
    return { gameName: slug, tagLine: "" };
  }
  const gameName = slug.slice(0, dashIdx);
  const tagLine = slug.slice(dashIdx + 1);
  return { gameName, tagLine };
}

export default async function PlayerPage({ params, searchParams }: Props) {
  const { platform, slug } = await params;
  const { game } = await searchParams;

  const { gameName, tagLine } = parsePlayerSlug(slug);

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
  const { gameName, tagLine } = parsePlayerSlug(slug);
  const title = tagLine ? `${gameName}#${tagLine} — RiftScope` : `${gameName} — RiftScope`;
  const desc = tagLine
    ? `View ${gameName}#${tagLine}'s profile, rank, match history and stats on ${platform.toUpperCase()}.`
    : `View ${gameName}'s profile on ${platform.toUpperCase()}.`;

  return {
    title,
    description: desc,
  };
}
