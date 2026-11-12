import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
} from "lightweight-charts";

type StockRecord = {
  date: string;
  open: number | string | null;
  high: number | string | null;
  low: number | string | null;
  close: number | string | null;
  volume?: number | string | null;
};

type Props = {
  history: StockRecord[];
  currency?: string;
};

type ValidRecord = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

function StockChart({ history, currency = "$" }: Props) {
  const candleRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const candleElement = candleRef.current;
    const lineElement = lineRef.current;

    if (!history?.length || !candleElement || !lineElement) {
      return;
    }

    // Step 1: Remove records containing null or missing OHLC values
    const normalized: ValidRecord[] = history
      .filter((item) => {
        return (
          item != null &&
          item.date != null &&
          item.open != null &&
          item.high != null &&
          item.low != null &&
          item.close != null
        );
      })
      .map((item) => ({
        date: String(item.date).slice(0, 10),
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
      }))
      .filter((item) => {
        return (
          /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
          [
            item.open,
            item.high,
            item.low,
            item.close,
          ].every(Number.isFinite) &&
          item.open > 0 &&
          item.high > 0 &&
          item.low > 0 &&
          item.close > 0 &&
          item.high >= item.low &&
          item.high >= item.open &&
          item.high >= item.close &&
          item.low <= item.open &&
          item.low <= item.close
        );
      });

    // Step 2: Remove duplicate dates and sort records
    const uniqueMap = new Map<string, ValidRecord>();

    normalized.forEach((item) => {
      uniqueMap.set(item.date, item);
    });

    const validHistory = Array.from(uniqueMap.values()).sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    console.log("Valid chart records:", validHistory.length);

    if (validHistory.length === 0) {
      return;
    }

    // Step 3: Create Candlestick Chart
    const candleChart = createChart(candleElement, {
      width: candleElement.clientWidth,
      height: 320,
      layout: {
        background: { color: "#0f172a" },
        textColor: "#cbd5e1",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      rightPriceScale: {
        borderColor: "#334155",
      },
      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
      },
    });

    const candles = candleChart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    candles.setData(
      validHistory.map((item) => ({
        time: item.date as `${number}-${number}-${number}`,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }))
    );

    // Step 4: Create Price History Line Chart
    const lineChart = createChart(lineElement, {
      width: lineElement.clientWidth,
      height: 280,
      layout: {
        background: { color: "#0f172a" },
        textColor: "#cbd5e1",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      rightPriceScale: {
        borderColor: "#334155",
      },
      timeScale: {
        borderColor: "#334155",
      },
    });

    const line = lineChart.addSeries(LineSeries, {
      color: "#38bdf8",
      lineWidth: 2,
    });

    line.setData(
      validHistory.map((item) => ({
        time: item.date as `${number}-${number}-${number}`,
        value: item.close,
      }))
    );

    // Step 5: Fit charts to available data
    candleChart.timeScale().fitContent();
    lineChart.timeScale().fitContent();

    // Step 6: Responsive chart sizing
    const resizeObserver = new ResizeObserver(() => {
      if (candleElement.clientWidth > 0) {
        candleChart.applyOptions({
          width: candleElement.clientWidth,
        });
      }

      if (lineElement.clientWidth > 0) {
        lineChart.applyOptions({
          width: lineElement.clientWidth,
        });
      }
    });

    resizeObserver.observe(candleElement);
    resizeObserver.observe(lineElement);

    // Step 7: Cleanup
    return () => {
      resizeObserver.disconnect();
      candleChart.remove();
      lineChart.remove();
    };
  }, [history]);

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
        <h2 className="mb-2 text-xl font-bold text-white">
          Candlestick Chart
        </h2>

        <p className="mb-4 text-sm text-slate-400">
          Open, High, Low and Close prices
        </p>

        <div ref={candleRef} className="w-full" />
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
        <h2 className="mb-2 text-xl font-bold text-white">
          Price History
        </h2>

        <p className="mb-4 text-sm text-slate-400">
          Closing price movement · {currency}
        </p>

        <div ref={lineRef} className="w-full" />
      </div>
    </div>
  );
}

export default StockChart;