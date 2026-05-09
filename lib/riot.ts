export const REGIONS: Record<string, string> = {
  americas: "https://americas.api.riotgames.com",
  europe: "https://europe.api.riotgames.com",
  asia: "https://asia.api.riotgames.com",
  sea: "https://sea.api.riotgames.com",
};

export const PLATFORMS: Record<string, string> = {
  na1: "https://na1.api.riotgames.com",
  euw1: "https://euw1.api.riotgames.com",
  eun1: "https://eun1.api.riotgames.com",
  kr: "https://kr.api.riotgames.com",
  br1: "https://br1.api.riotgames.com",
  la1: "https://la1.api.riotgames.com",
  la2: "https://la2.api.riotgames.com",
  oc1: "https://oc1.api.riotgames.com",
  tr1: "https://tr1.api.riotgames.com",
  ru: "https://ru.api.riotgames.com",
  jp1: "https://jp1.api.riotgames.com",
  sg2: "https://sg2.api.riotgames.com",
};

export const PLATFORM_TO_REGION: Record<string, string> = {
  na1: "americas", br1: "americas", la1: "americas", la2: "americas",
  euw1: "europe", eun1: "europe", tr1: "europe", ru: "europe",
  kr: "asia", jp1: "asia",
  oc1: "sea", sg2: "sea",
};

export async function riotFetch<T>(url: string): Promise<T> {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) throw new Error("RIOT_API_KEY not set");

  const res = await fetch(url, {
    headers: { "X-Riot-Token": apiKey },
    next: { revalidate: 30 },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.status?.message || `Riot API error ${res.status}`);
  }
  return data as T;
}

export function riotError(e: unknown) {
  const msg = e instanceof Error ? e.message : "Unknown error";
  const status = msg.includes("404") ? 404 : msg.includes("403") ? 403 : 500;
  return Response.json({ error: msg }, { status });
}