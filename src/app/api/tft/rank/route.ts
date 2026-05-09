import { NextRequest } from "next/server";
import { PLATFORMS, riotFetch, riotError } from "@/lib/riot";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const summonerId = searchParams.get("summonerId");
  const platform = searchParams.get("platform") || "na1";

  if (!summonerId) return Response.json({ error: "summonerId required" }, { status: 400 });

  try {
    const base = PLATFORMS[platform];
    const data = await riotFetch(`${base}/tft/league/v1/entries/by-summoner/${summonerId}`);
    return Response.json(data);
  } catch (e) {
    return riotError(e);
  }
}