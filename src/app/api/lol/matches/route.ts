import { NextRequest } from "next/server";
import { REGIONS, riotFetch, riotError } from "@/lib/riot";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const puuid = searchParams.get("puuid");
  const region = searchParams.get("region") || "americas";
  const start = searchParams.get("start") || "0";
  const count = searchParams.get("count") || "10";

  if (!puuid) return Response.json({ error: "puuid required" }, { status: 400 });

  try {
    const base = REGIONS[region];
    const data = await riotFetch(
      `${base}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`
    );
    return Response.json(data);
  } catch (e) {
    return riotError(e);
  }
}