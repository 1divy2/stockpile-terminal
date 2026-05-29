import { useQuery } from "@tanstack/react-query";

type MarketNewsItem = {
  headline: string;
  source: string;
  category: string;
  url: string;
};

async function fetchYahooRSS() {
  const response = await fetch(
    "https://api.rss2json.com/v1/api.json?rss_url=https://finance.yahoo.com/rss/topstories",
  );

  const data = await response.json();

  if (!data.items) {
    return [];
  }

  return data.items.slice(0, 12).map(
    (item: { title: string; link: string }): MarketNewsItem => ({
      headline: item.title,
      source: "Yahoo Finance",
      category: "Markets",
      url: item.link,
    }),
  );
}

export function useMarketNews() {
  return useQuery({
    queryKey: ["market-news"],

    queryFn: fetchYahooRSS,

    staleTime: 1000 * 60 * 10,

    gcTime: 1000 * 60 * 60,

    retry: false,

    refetchOnWindowFocus: false,

    refetchInterval: false,
  });
}
