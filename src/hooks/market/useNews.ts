import { useQuery } from "@tanstack/react-query";
import { analyzeSentiment, SentimentResult } from "@/utils/sentiment";

export type NewsArticle = {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sentiment: SentimentResult;
};

async function fetchTickerNews(ticker: string): Promise<NewsArticle[]> {
  try {
    // We use allorigins.win as a free CORS proxy to fetch the Yahoo Finance RSS feed
    const rssUrl = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(ticker)}&region=US&lang=en-US`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch news for ${ticker}`);
    }

    const data = await response.json();

    // The proxy returns the raw response body in data.contents
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data.contents, "text/xml");

    const items = xmlDoc.querySelectorAll("item");
    const articles: NewsArticle[] = [];

    items.forEach((item) => {
      const title = item.querySelector("title")?.textContent || "";
      const link = item.querySelector("link")?.textContent || "";
      const pubDate = item.querySelector("pubDate")?.textContent || "";
      const guid = item.querySelector("guid")?.textContent || Math.random().toString(36);

      // Compute sentiment on the headline
      const sentiment = analyzeSentiment(title);

      articles.push({
        id: guid,
        title,
        link,
        pubDate,
        source: "Yahoo Finance",
        sentiment,
      });
    });

    return articles;
  } catch (err) {
    console.error("News fetch error:", err);
    return [];
  }
}

export function useNews(ticker: string, enabled = true) {
  return useQuery({
    queryKey: ["news", ticker],
    queryFn: () => fetchTickerNews(ticker),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000,
    enabled: enabled && !!ticker,
  });
}
