import datetime as dt
import sys
from dataclasses import dataclass
from typing import List, Optional

import pandas as pd
import yfinance as yf


@dataclass
class Signal:
    timestamp: pd.Timestamp
    setup: str
    side: str
    entry: float
    stop: float
    targets: List[float]


def _prompt_symbol() -> str:
    raw = input("Symbol (e.g., AAPL): ").strip().upper()
    if not raw:
        print("Symbol required.")
        sys.exit(1)
    return raw


def _get_data(symbol: str, start: dt.date, end: dt.date) -> pd.DataFrame:
    df = yf.download(
        symbol,
        start=start.isoformat(),
        end=end.isoformat(),
        interval="1m",
        progress=False,
        auto_adjust=False,
    )
    if df.empty:
        return df
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [c[0] for c in df.columns]
    df = df.rename(columns=str.title)
    df = df[["Open", "High", "Low", "Close", "Volume"]]
    return df


def _vwap(df: pd.DataFrame) -> pd.Series:
    typical = (df["High"] + df["Low"] + df["Close"]) / 3.0
    pv = typical * df["Volume"]
    return pv.cumsum() / df["Volume"].cumsum()


def _entry_in_zone(bar: pd.Series, zone_low: float, zone_high: float) -> bool:
    return bar["Low"] <= zone_high and bar["High"] >= zone_low


def _close_in_zone(bar: pd.Series, zone_low: float, zone_high: float) -> bool:
    return zone_low <= bar["Close"] <= zone_high


def _stop_from_entry(entry: float, side: str, max_pct: float) -> float:
    if side == "LONG":
        return round(entry * (1.0 - max_pct), 2)
    return round(entry * (1.0 + max_pct), 2)


def _add_signal(
    signals: List[Signal],
    ts: pd.Timestamp,
    setup: str,
    side: str,
    entry: float,
    max_stop_pct: float,
    targets: List[float],
) -> None:
    stop = _stop_from_entry(entry, side, max_stop_pct)
    signals.append(
        Signal(
            timestamp=ts,
            setup=setup,
            side=side,
            entry=round(entry, 2),
            stop=stop,
            targets=[round(t, 2) for t in targets],
        )
    )


def _find_signals_for_day(day_df: pd.DataFrame, max_stop_pct: float) -> List[Signal]:
    signals: List[Signal] = []
    vwap = _vwap(day_df)

    support_touch_low: Optional[float] = None
    support_confirmed = False
    vwap_reclaim_crossed = False
    vwap_reclaim_done = False

    breakout_done = False
    rejection_done = False
    vwap_reject_done = False
    breakdown_done = False

    day_high = -float("inf")
    day_low = float("inf")

    for i, (ts, bar) in enumerate(day_df.iterrows()):
        day_high = max(day_high, bar["High"])
        day_low = min(day_low, bar["Low"])
        vw = vwap.iloc[i]

        # Support Bounce (High Probability): 69.20-69.50, confirm higher low + VWAP reclaim
        if not support_confirmed:
            if support_touch_low is None and _entry_in_zone(bar, 69.20, 69.50):
                support_touch_low = bar["Low"]
            elif support_touch_low is not None:
                if bar["Low"] > support_touch_low and bar["Close"] > vw:
                    _add_signal(
                        signals,
                        ts,
                        "Support Bounce",
                        "LONG",
                        bar["Close"],
                        max_stop_pct,
                        [70.20, 70.80, 71.00],
                    )
                    support_confirmed = True

        # VWAP Reclaim Long: break above VWAP, retest, hold
        if not vwap_reclaim_done:
            if not vwap_reclaim_crossed:
                if i > 0 and day_df.iloc[i - 1]["Close"] <= vwap.iloc[i - 1] and bar["Close"] > vw:
                    vwap_reclaim_crossed = True
            else:
                if bar["Low"] <= vw and bar["Close"] >= vw:
                    _add_signal(
                        signals,
                        ts,
                        "VWAP Reclaim Long",
                        "LONG",
                        bar["Close"],
                        max_stop_pct,
                        [vw + 0.40, day_high],
                    )
                    vwap_reclaim_done = True

        # Breakout Over 71.00: 71.10-71.30
        if not breakout_done and _close_in_zone(bar, 71.10, 71.30):
            _add_signal(
                signals,
                ts,
                "Breakout Over 71.00",
                "LONG",
                bar["Close"],
                max_stop_pct,
                [72.00, 72.50],
            )
            breakout_done = True

        # Rejection at 70.80-71.00
        if not rejection_done and _entry_in_zone(bar, 70.80, 71.00) and bar["Close"] < bar["Open"]:
            _add_signal(
                signals,
                ts,
                "Rejection at 70.80-71.00",
                "SHORT",
                bar["Close"],
                max_stop_pct,
                [70.20, 69.50, 69.20],
            )
            rejection_done = True

        # VWAP Reject Short: pop into VWAP from below -> reject
        if not vwap_reject_done:
            if i > 0 and day_df.iloc[i - 1]["Close"] < vwap.iloc[i - 1] and bar["High"] >= vw and bar["Close"] < vw:
                _add_signal(
                    signals,
                    ts,
                    "VWAP Reject Short",
                    "SHORT",
                    bar["Close"],
                    max_stop_pct,
                    [vw - 0.40, day_low],
                )
                vwap_reject_done = True

        # Breakdown Under 69.20: 69.10-68.90
        if not breakdown_done and _close_in_zone(bar, 68.90, 69.10) and bar["Close"] < bar["Open"]:
            _add_signal(
                signals,
                ts,
                "Breakdown Under 69.20",
                "SHORT",
                bar["Close"],
                max_stop_pct,
                [68.50, 67.80],
            )
            breakdown_done = True

    return signals


def main() -> None:
    symbol = _prompt_symbol()
    end_date = dt.date.today() + dt.timedelta(days=1)
    start_date = end_date - dt.timedelta(days=7)

    df = _get_data(symbol, start_date, end_date)
    if df.empty:
        print("No data returned. Check symbol, date, and market hours.")
        return

    df = df.dropna()
    df = df.sort_index()

    # Limit to most recent 5 trading days in the last 7 days
    df["TradeDate"] = df.index.date
    unique_days = sorted(set(d for d in df["TradeDate"] if d >= start_date))
    keep_days = set(unique_days[-5:])
    df = df[df["TradeDate"].isin(keep_days)]

    if df.empty:
        print("No data in the requested 5 trading days.")
        return

    all_signals: List[Signal] = []
    for day, day_df in df.groupby("TradeDate"):
        day_df = day_df.drop(columns=["TradeDate"]).copy()
        all_signals.extend(_find_signals_for_day(day_df, max_stop_pct=0.30))

    if not all_signals:
        print("No signals found for the given window.")
        return

    print(f"Signals for {symbol}:")
    for s in all_signals:
        targets = ", ".join(f"{t:.2f}" for t in s.targets)
        print(
            f"{s.timestamp} | {s.setup} | {s.side} | "
            f"Entry: {s.entry:.2f} | Stop: {s.stop:.2f} | Targets: {targets}"
        )


if __name__ == "__main__":
    main()
