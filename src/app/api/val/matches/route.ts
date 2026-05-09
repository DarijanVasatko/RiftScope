import { NextRequest } from "next/server";
import { riotFetch, riotError } from "@/lib/riot";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const matchId = searchParams.get("matchId");
  const platform = searchParams.get("platform") || "na";

  if (!matchId) return Response.json({ error: "matchId required" }, { status: 400 });

  try {
    const base = `https://${platform}.api.riotgames.com`;
    const data = await riotFetch(`${base}/val/match/v1/matches/${matchId}`);
    return Response.json(data);
  } catch (e) {
    return riotError(e);
  }
}