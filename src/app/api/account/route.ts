import { NextRequest } from "next/server";
import { REGIONS, riotError } from "@/lib/riot";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const gameName = searchParams.get("gameName");
  const tagLine = searchParams.get("tagLine");
  const region = searchParams.get("region") || "americas";

  if (!gameName || !tagLine) {
    return Response.json({ error: "gameName and tagLine required" }, { status: 400 });
  }

  const apiKey = process.env.RIOT_API_KEY;
  console.log("API Key present:", !!apiKey, "| starts with:", apiKey?.slice(0, 10));
  console.log("Searching:", gameName, "#", tagLine, "region:", region);

  try {
    const base = REGIONS[region] || REGIONS.americas;
    const url = `${base}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    console.log("Fetching:", url);

    const res = await fetch(url, { headers: { "X-Riot-Token": apiKey! } });
    const data = await res.json();
    console.log("Riot response status:", res.status, "| body:", JSON.stringify(data).slice(0, 200));

    if (!res.ok) return Response.json({ error: data?.status?.message || "Riot API error" }, { status: res.status });
    return Response.json(data);
  } catch (e) {
    return riotError(e);
  }
}