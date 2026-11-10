import { NextRequest } from "next/server";
import { PLATFORMS, riotFetch, riotError } from "@/lib/riot";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("puuid") || searchParams.get("summonerId");
  const platform = searchParams.get("platform") || "na1";

  if (!id) return Response.json({ error: "puuid or summonerId required" }, { status: 400 });

  try {
    const base = PLATFORMS[platform] || PLATFORMS.na1;
    const data = await riotFetch(`${base}/lol/spectator/v5/active-games/by-summoner/${id}`);
    return Response.json(data);
  } catch (e) {
    return riotError(e);
  }
}
