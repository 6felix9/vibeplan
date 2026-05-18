export function buildActivityLoadingHref(query: string) {
  const searchParams = {
    activities: [],
    budget: 2,
    mbti: "",
    spicy: false,
    query,
  };
  const params = new URLSearchParams();
  params.set("data", JSON.stringify(searchParams));
  return `/loading?${params.toString()}`;
}

export function buildPlanAroundQuery({
  title,
  location,
  vibe,
}: {
  title: string;
  location: string;
  vibe: string;
}) {
  return `Plan a day around ${title} near ${location}. Keep it ${vibe.toLowerCase()} and include deals if possible.`;
}
