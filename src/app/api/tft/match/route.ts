import { NextRequest } from "next/server";
import { REGIONS, riotFetch, riotError } from "@/lib/riot";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const matchId = searchParams.get("matchId");
  const region = searchParams.get("region") || "americas";

  if (!matchId) return Response.json({ error: "matchId required" }, { status: 400 });

  try {
    const base = REGIONS[region];
    const data = await riotFetch(`${base}/tft/match/v1/matches/${matchId}`);
    return Response.json(data);
  } catch (e) {
    return riotError(e);
  }
}