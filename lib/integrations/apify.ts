const APIFY_BASE_URL = "https://api.apify.com/v2";

type ActorItem = Record<string, unknown>;

function actorPath(actorId: string) {
  return actorId.replace("/", "~");
}

async function runActor(actorId: string, input: Record<string, unknown>): Promise<ActorItem[]> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error("APIFY_API_TOKEN não configurado.");

  const response = await fetch(
    `${APIFY_BASE_URL}/acts/${actorPath(actorId)}/run-sync-get-dataset-items`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      cache: "no-store",
      signal: AbortSignal.timeout(35_000),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Apify falhou (${response.status}): ${details.slice(0, 240)}`);
  }

  return (await response.json()) as ActorItem[];
}

export function crawlCompanyWebsite(websiteUrl: string) {
  return runActor(process.env.APIFY_WEBSITE_ACTOR ?? "apify/website-content-crawler", {
    startUrls: [{ url: websiteUrl }],
    maxCrawlPages: 4,
  });
}

export function scrapeInstagramProfile(username: string) {
  return runActor(process.env.APIFY_INSTAGRAM_ACTOR ?? "apify/instagram-profile-scraper", {
    usernames: [username.replace(/^@/, "")],
  });
}
