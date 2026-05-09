import { NextRequest } from "next/server";
import { PLATFORMS, riotFetch, riotError } from "@/lib/riot";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const puuid = searchParams.get("puuid");
  const platform = searchParams.get("platform") || "na1";
  const count = searchParams.get("count") || "10";

  if (!puuid) return Response.json({ error: "puuid required" }, { status: 400 });

  try {
    const base = PLATFORMS[platform];
    const data = await riotFetch(
      `${base}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`
    );
    return Response.json(data);
  } catch (e) {
    return riotError(e);
  }
}