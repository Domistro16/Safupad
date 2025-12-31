'use client'

import React, { useEffect, useMemo, useState, use } from 'react'
import { useSafuPadSDK } from "@/lib/safupad-sdk";
import { fetchTokenData } from "@/lib/token-utils";
import type { Token } from "@/types/token";
import { ethers } from "ethers";
import { Loader2 } from "lucide-react";

// --- Helpers ---
function formatPrice(p: number) {
  if (!p) return "0.00";
  return p < 0.001 ? p.toExponential(4) : p.toFixed(4);
}

function formatAddress(addr: string) {
  if (!addr) return "???";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function timeSince(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

function formatNumber(n: number) {
  if (!n) return "0";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(2);
}

export default function InstantLaunchTokenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { sdk, connect } = useSafuPadSDK();

  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState<any[]>([]);

  // Input states
  const [amountIn, setAmountIn] = useState("");
  const [isBuy, setIsBuy] = useState(true);
  const [tradeLoading, setTradeLoading] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'chart' | 'trades' | 'about'>('chart');
  const [chartTimeframe, setChartTimeframe] = useState('1h');

  // Load token data
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      if (!sdk) return;
      try {
        setLoading(true);
        const tData = await fetchTokenData(sdk, id);
        if (!cancelled) setToken(tData);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; }
  }, [sdk, id]);

  // Fetch trades separately once we have the token's contract address
  useEffect(() => {
    if (!sdk || !token?.contractAddress) return;

    let cancelled = false;
    const fetchTrades = async () => {
      try {
        console.log("📊 Fetching trades for:", token.contractAddress);
        const tHistory = await sdk.bondingDex.getRecentTrades(token.contractAddress, 100);
        console.log("📊 Fetched trades:", tHistory?.length || 0);
        if (!cancelled) setTrades(tHistory || []);
      } catch (e) {
        console.warn("Failed to fetch trades", e);
      }
    };

    fetchTrades();
    const interval = setInterval(fetchTrades, 10000); // Poll every 10s
    return () => { cancelled = true; clearInterval(interval); }
  }, [sdk, token?.contractAddress]);

  // Derive Chart Data
  const chartPath = useMemo(() => {
    if (!trades.length) return "";

    // Sort chronological
    const sorted = [...trades].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

    // Filter by timeframe (placeholder logic, simple slice for now or full)
    // Real logic would filter by timestamp vs now
    const dataPoints = sorted.map(t => ({
      price: Number(ethers.formatEther(t.price)),
      ts: Number(t.timestamp)
    }));

    if (dataPoints.length < 2) return "M0,50 L100,50"; // Flat line fallback

    const prices = dataPoints.map(d => d.price);
    const minP = Math.min(...prices) * 0.95;
    const maxP = Math.max(...prices) * 1.05;
    const rangeP = maxP - minP || 1;

    const minT = dataPoints[0].ts;
    const maxT = dataPoints[dataPoints.length - 1].ts;
    const rangeT = maxT - minT || 1;

    let d = "M0," + (100 - ((dataPoints[0].price - minP) / rangeP) * 100); // Start

    dataPoints.forEach(p => {
      const x = ((p.ts - minT) / rangeT) * 100;
      const y = 100 - ((p.price - minP) / rangeP) * 100;
      d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return d;
  }, [trades, chartTimeframe]);


  const handleTrade = async () => {
    if (!sdk || !token) return;
    try {
      setTradeLoading(true);
      let tx;
      if (isBuy) {
        // Buy: pass BNB amount as string, minTokenOut as 0 for simplicity
        tx = await sdk.bondingDex.buyTokens(
          token.contractAddress,
          amountIn, // BNB amount as string
          0 // minTokenOut (0 for no slippage protection - demo only)
        );
      } else {
        // Sell: need to approve first, then sell
        const signer = sdk.getSigner();
        const tokenContract = new ethers.Contract(
          token.contractAddress,
          ["function approve(address spender, uint256 value) external returns (bool)"],
          signer
        );

        // Approve bonding DEX to spend tokens
        const approveTx = await tokenContract.approve(
          sdk.bondingDex.getAddress(),
          ethers.parseEther(amountIn)
        );
        await approveTx.wait();

        // Sell tokens
        tx = await sdk.bondingDex.sellTokens(
          token.contractAddress,
          amountIn // Token amount as string
        );
      }
      await tx.wait();
      setAmountIn("");
      // Refetch will happen on poll or we can trigger it
    } catch (e: any) {
      alert("Trade failed: " + (e.message || String(e)));
    } finally {
      setTradeLoading(false);
    }
  };

  // --- Render ---

  if (!sdk) return <div className="flex h-screen items-center justify-center"><button onClick={() => connect()} className="btn-primary">Connect Wallet</button></div>;
  if (loading && !token) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-accent" /></div>;
  if (!token) return <div className="p-10 text-center">Token not found</div>;

  const instant = token.instantLaunch;
  const bondingBnb = instant?.cumulativeBuys || 0; // mapped from bnbReserve
  const progress = Math.min(100, (bondingBnb / 15) * 100);
  const color = token.priceChange24h >= 0 ? 'text-emerald-500' : 'text-rose-500';
  const priceDisplay = token.currentPrice ? `$${token.currentPrice < 0.001 ? token.currentPrice.toExponential(4) : token.currentPrice.toFixed(6)}` : "-";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border)] h-16 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="btn-ghost text-lg">←</a>
          <div className="flex items-center gap-2">
            <img src={token.image} className="w-8 h-8 rounded-full bg-gray-700" alt="" />
            <span className="font-semibold">{token.symbol}</span>
            <span className={`text-xs ${color}`}>{token.priceChange24h.toFixed(2)}%</span>
          </div>
        </div>
        <button className="btn-secondary text-xs" onClick={() => {/* theme toggle logic if needed */ }}>Theme</button>
      </header>

      <main className="pt-20 px-4 pb-24 max-w-7xl mx-auto grid lg:grid-cols-[1fr_360px] gap-6">

        {/* LEFT COLUMN */}
        <div className="space-y-6">

          {/* Chart Card */}
          <div className="safu-card p-0 overflow-hidden min-h-[400px] flex flex-col">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <div className="text-2xl font-semibold tracking-tight">{priceDisplay}</div>
                <div className="text-xs text-[var(--subtext)]">Last price</div>
              </div>
              <div className="flex gap-1">
                {['1m', '1h', '4h', '1d'].map(tf => (
                  <button key={tf}
                    onClick={() => setChartTimeframe(tf)}
                    className={`px-2 py-1 rounded text-xs ${chartTimeframe === tf ? 'bg-[var(--accent)] text-white' : 'text-[var(--subtext)] hover:bg-[var(--surface-soft)]'}`}>
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 relative bg-[var(--surface-soft)]/20 p-4">
              {/* Dynamic SVG Chart */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {chartPath && (
                  <>
                    <path d={chartPath} fill="none" stroke="var(--accent)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                    <path d={chartPath + " L100,100 L0,100 Z"} fill="url(#g1)" stroke="none" />
                  </>
                )}
              </svg>
              {!trades.length && <div className="absolute inset-0 flex items-center justify-center text-[var(--subtext)]">No trades yet</div>}
            </div>
          </div>

          {/* TABS */}
          <div className="safu-card p-0 overflow-hidden">
            <div className="flex border-b border-[var(--border)]">
              {['chart', 'trades', 'about'].map(t => (
                <button key={t}
                  onClick={() => setActiveTab(t as any)}
                  className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === t ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--subtext)]'}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="p-0">
              {activeTab === 'trades' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[var(--subtext)] bg-[var(--surface-soft)] uppercase">
                      <tr>
                        <th className="px-4 py-2">Type</th>
                        <th className="px-4 py-2">Price</th>
                        <th className="px-4 py-2">Amount (BNB)</th>
                        <th className="px-4 py-2">Age</th>
                        <th className="px-4 py-2">Tx</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((t) => (
                        <tr key={t.txHash} className="border-b border-[var(--border-soft)] hover:bg-[var(--surface-soft)]">
                          <td className={`px-4 py-2 font-medium ${t.type === 'buy' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {t.type.toUpperCase()}
                          </td>
                          <td className="px-4 py-2">{Number(ethers.formatEther(t.price)).toFixed(6)}</td>
                          <td className="px-4 py-2">{Number(ethers.formatEther(t.bnbAmount)).toFixed(4)}</td>
                          <td className="px-4 py-2 text-[var(--subtext)]">{timeSince(Number(t.timestamp) * 1000)}</td>
                          <td className="px-4 py-2"><a href={`https://bscscan.com/tx/${t.txHash}`} target="_blank" className="hover:underline">View</a></td>
                        </tr>
                      ))}
                      {!trades.length && <tr><td colSpan={5} className="p-4 text-center text-[var(--subtext)]">No trades found</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="p-6">
                  <h3 className="font-medium mb-2">{token.name} ({token.symbol})</h3>
                  <p className="text-[var(--subtext)]">{token.description}</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-[var(--surface-soft)] rounded-lg">
                      <div className="text-[var(--subtext)]">Market Cap</div>
                      <div className="font-medium">${formatNumber(token.marketCap)}</div>
                    </div>
                    <div className="p-3 bg-[var(--surface-soft)] rounded-lg">
                      <div className="text-[var(--subtext)]">Liquidity</div>
                      <div className="font-medium">${formatNumber(token.liquidityPool)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - Trading */}
        <div className="space-y-6">

          {/* Bonding Curve */}
          <div className="safu-card p-5">
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-sm font-medium uppercase tracking-wider text-[var(--subtext)]">Bonding Curve</h3>
              <span className="text-xs text-[var(--accent)] font-medium">{progress.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-[var(--surface-soft)] rounded-full overflow-hidden border border-[var(--border-soft)]">
              <div style={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-[var(--accent)] to-purple-500 transition-all duration-500" />
            </div>
            <div className="mt-2 text-xs text-[var(--subtext)] flex justify-between">
              <span>Graduation limit</span>
              <span>{bondingBnb.toFixed(2)} / 15 BNB</span>
            </div>
            <p className="mt-4 text-xs text-[var(--subtext)] leading-relaxed">
              When market cap reaches ~60k (15 BNB pool), the token graduates to PancakeSwap with liquidity burned.
            </p>
          </div>

          {/* Trade Panel */}
          <div className="safu-card p-5">
            <div className="flex p-1 bg-[var(--surface-soft)] rounded-xl mb-4">
              <button onClick={() => setIsBuy(true)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${isBuy ? 'bg-emerald-500 text-white shadow-lg' : 'text-[var(--subtext)] hover:text-[var(--text)]'}`}>
                Buy
              </button>
              <button onClick={() => setIsBuy(false)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${!isBuy ? 'bg-rose-500 text-white shadow-lg' : 'text-[var(--subtext)] hover:text-[var(--text)]'}`}>
                Sell
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--subtext)]">Amount ({isBuy ? 'BNB' : token.symbol})</span>
                  <span className="text-[var(--accent)] cursor-pointer hover:underline">Max</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0.0"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 font-mono focus:border-[var(--accent)] outline-none transition-all"
                    value={amountIn}
                    onChange={e => setAmountIn(e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--subtext)]">
                    {isBuy ? 'BNB' : token.symbol}
                  </div>
                </div>
              </div>

              <button
                onClick={handleTrade}
                disabled={tradeLoading || !amountIn}
                className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isBuy ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}>
                {tradeLoading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : (isBuy ? 'Place Buy Order' : 'Place Sell Order')}
              </button>
            </div>
          </div>

          {/* Token Info */}
          <div className="safu-card p-5 space-y-3">
            <div className="flex justify-between text-sm border-b border-[var(--border-soft)] pb-3">
              <span className="text-[var(--subtext)]">Holders</span>
              <span className="font-medium">{token.holders || 0}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-[var(--border-soft)] pb-3">
              <span className="text-[var(--subtext)]">Transactions</span>
              <span className="font-medium">{token.transactions || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--subtext)]">Created by</span>
              <span className="font-medium font-mono text-xs">{formatAddress(token.creatorAddress)}</span>
            </div>
          </div>

        </div>

      </main>
    </div>
  )
}
