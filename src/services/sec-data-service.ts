export type SECFiling = {
  id: string;
  type: string;
  title: string;
  filedAt: string;
  url: string;
  aiSummary: string;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
};

export class SECDataService {
  static async getFilings(symbol: string): Promise<SECFiling[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = new Date();
        const filings: SECFiling[] = [
          {
            id: crypto.randomUUID(),
            type: "8-K",
            title: "Current Report - Material Events",
            filedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            url: "#",
            aiSummary: `The company announced a new strategic partnership with a major cloud provider to expand their enterprise offerings. Expected to boost Q3 revenues by 15%.`,
            sentiment: "POSITIVE"
          },
          {
            id: crypto.randomUUID(),
            type: "10-Q",
            title: "Quarterly Report",
            filedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
            url: "#",
            aiSummary: `Q2 earnings beat expectations with an EPS of $1.12 vs $0.98 estimated. Revenue grew 22% YoY. However, management cited macroeconomic headwinds for the remainder of the year.`,
            sentiment: "NEUTRAL"
          },
          {
            id: crypto.randomUUID(),
            type: "4",
            title: "Statement of Changes in Beneficial Ownership",
            filedAt: new Date(now.getTime() - 48 * 24 * 60 * 60 * 1000).toISOString(), 
            url: "#",
            aiSummary: `CEO disposed of 50,000 shares at an average price of $142.50. This appears to be a scheduled 10b5-1 selling plan.`,
            sentiment: "NEUTRAL"
          },
          {
            id: crypto.randomUUID(),
            type: "10-K",
            title: "Annual Report",
            filedAt: new Date(now.getTime() - 135 * 24 * 60 * 60 * 1000).toISOString(), 
            url: "#",
            aiSummary: `Full-year results showed strong operational efficiency. Operating margins expanded by 300 bps. Supply chain risks remain a primary concern outlined in the Risk Factors section.`,
            sentiment: "POSITIVE"
          },
          {
            id: crypto.randomUUID(),
            type: "8-K",
            title: "Current Report - Earnings Release",
            filedAt: new Date(now.getTime() - 135 * 24 * 60 * 60 * 1000).toISOString(), 
            url: "#",
            aiSummary: `Missed Q4 revenue targets due to forex impacts and delayed product launches in APAC region. Forward guidance revised downwards.`,
            sentiment: "NEGATIVE"
          }
        ];
        resolve(filings);
      }, 600);
    });
  }
}
