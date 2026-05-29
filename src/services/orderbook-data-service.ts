export type OrderBookLevel = {
  price: number;
  size: number;
  orders: number;
  exchange: string;
};

export type OrderBookData = {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
};

export class OrderBookDataService {
  private static exchanges = ["NYSE", "NASDAQ", "BATS", "ARCA", "EDGX"];

  static generateL2Data(symbol: string, currentPrice: number): OrderBookData {
    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];
    const spread = currentPrice > 100 ? 0.05 : 0.01;
    
    // Generate Bids (buyers, lower than current)
    let bidPrice = currentPrice - spread;
    for (let i = 0; i < 30; i++) {
      bids.push({
        price: Number(bidPrice.toFixed(2)),
        size: Math.floor(Math.random() * 500) + 10,
        orders: Math.floor(Math.random() * 5) + 1,
        exchange: this.exchanges[Math.floor(Math.random() * this.exchanges.length)]
      });
      bidPrice -= (Math.random() * spread * 2);
    }

    // Generate Asks (sellers, higher than current)
    let askPrice = currentPrice + spread;
    for (let i = 0; i < 30; i++) {
      asks.push({
        price: Number(askPrice.toFixed(2)),
        size: Math.floor(Math.random() * 500) + 10,
        orders: Math.floor(Math.random() * 5) + 1,
        exchange: this.exchanges[Math.floor(Math.random() * this.exchanges.length)]
      });
      askPrice += (Math.random() * spread * 2);
    }

    return {
      symbol,
      bids,
      asks,
      timestamp: Date.now()
    };
  }
}
