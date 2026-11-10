export class RiotApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "RiotApiError";
    this.status = status;
  }
}

export const REGIONS: Record<string, string> = {
  americas: "https://americas.api.riotgames.com",
  europe: "https://europe.api.riotgames.com",
  asia: "https://asia.api.riotgames.com",
  sea: "https://sea.api.riotgames.com",
};

export const PLATFORMS: Record<string, string> = {
  // League & TFT
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
  // Valorant shards
  na: "https://na.api.riotgames.com",
  eu: "https://eu.api.riotgames.com",
  ap: "https://ap.api.riotgames.com",
  latam: "https://latam.api.riotgames.com",
  br: "https://br.api.riotgames.com",
};

export const PLATFORM_TO_REGION: Record<string, string> = {
  // LoL / TFT platforms
  na1: "americas", br1: "americas", la1: "americas", la2: "americas",
  euw1: "europe", eun1: "europe", tr1: "europe", ru: "europe",
  kr: "asia", jp1: "asia",
  oc1: "sea", sg2: "sea",
  // Valorant platforms
  na: "americas", latam: "americas", br: "americas",
  eu: "europe",
  ap: "sea",
};

export async function riotFetch<T>(url: string): Promise<T> {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) throw new RiotApiError("RIOT_API_KEY not set", 500);

  const res = await fetch(url, {
    headers: { "X-Riot-Token": apiKey },
    next: { revalidate: 30 },
  });

  let data: { status?: { message?: string } } | null = null;
  try {
    data = (await res.json()) as { status?: { message?: string } };
  } catch {
    // Non-JSON response
  }

  if (!res.ok) {
    const message = data?.status?.message || (res.status === 404 ? "Data not found" : `Riot API error ${res.status}`);
    throw new RiotApiError(message, res.status);
  }
  return data as unknown as T;
}

export function riotError(e: unknown) {
  if (e instanceof RiotApiError) {
    return Response.json({ error: e.message }, { status: e.status });
  }

  const msg = e instanceof Error ? e.message : "Unknown error";
  const lower = msg.toLowerCase();
  let status = 500;
  if (lower.includes("404") || lower.includes("not found")) status = 404;
  else if (lower.includes("403") || lower.includes("forbidden") || lower.includes("unauthorized")) status = 403;
  else if (lower.includes("429") || lower.includes("rate limit")) status = 429;

  return Response.json({ error: msg }, { status });
}
