import { NextRequest } from "next/server";
import { PLATFORMS, riotFetch, riotError } from "@/lib/riot";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const puuid = searchParams.get("puuid");
  const platform = searchParams.get("platform") || "na1";

  if (!puuid) return Response.json({ error: "puuid required" }, { status: 400 });

  try {
    const base = PLATFORMS[platform];
    const data = await riotFetch(`${base}/lol/summoner/v4/summoners/by-puuid/${puuid}`);
    return Response.json(data);
  } catch (e) {
    return riotError(e);
  }
}