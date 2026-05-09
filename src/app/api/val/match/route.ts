import { NextRequest } from "next/server";
import { riotFetch, riotError } from "@/lib/riot";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const puuid = searchParams.get("puuid");
  const platform = searchParams.get("platform") || "na";

  if (!puuid) return Response.json({ error: "puuid required" }, { status: 400 });

  try {
    const base = `https://${platform}.api.riotgames.com`;
    const data = await riotFetch(`${base}/val/match/v1/matchlists/by-puuid/${puuid}`);
    return Response.json(data);
  } catch (e) {
    return riotError(e);
  }
}