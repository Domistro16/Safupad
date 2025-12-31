"use client";

import { useMemo, useState, useEffect } from 'react'
import { useSafuPadSDK } from "@/lib/safupad-sdk";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { Loader2 } from "lucide-react";

type Tab = 'project' | 'instant' | 'activity'

interface ActivityItem {
  token: string;
  side: string;
  amount: string;
  when: string;
  txHash: string;
  timestamp: number;
}

export default function SafuPortfolioPage() {
  const [tab, setTab] = useState<Tab>('project')
  const { sdk } = useSafuPadSDK();
  const { address } = useAccount();

  const [projects, setProjects] = useState<any[]>([]);
  const [instantLaunches, setInstantLaunches] = useState<any[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sdk || !address) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const addr = address;

        // 1. Fetch Projects (Created by user)
        // Note: Ideally we'd also show where user contributed, but let's start with created
        const myProjects = await sdk.graph?.getLaunches({ founder: addr, launchType: 'PROJECT_RAISE' }) || [];
        setProjects(myProjects);

        // 2. Fetch Instant Launches (Created by user)
        const myInstant = await sdk.graph?.getLaunches({ founder: addr, launchType: 'INSTANT_LAUNCH' }) || [];
        setInstantLaunches(myInstant);

        // 3. Fetch Activity (Trades)
        const myTrades = await sdk.graph?.getUserTrades(addr, { first: 20 }) || [];

        const mappedActivity = myTrades.map(t => ({
          token: t.token.symbol,
          side: t.isBuy ? 'Buy' : 'Sell',
          amount: `${Number(ethers.formatEther(t.bnbAmount)).toFixed(4)} BNB`,
          when: timeSince(Number(t.timestamp)),
          txHash: t.transactionHash,
          timestamp: Number(t.timestamp)
        }));
        setActivity(mappedActivity);

      } catch (e) {
        console.error("Failed to fetch portfolio data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sdk, address]);


  function timeSince(ts: number) {
    const s = Math.floor(Date.now() / 1000 - ts);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  if (!address) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center px-4">
        <h2 className="text-xl font-semibold mb-2">Connect Wallet</h2>
        <p className="text-[var(--subtext)] mb-6">Connect your wallet to view your portfolio</p>
        {/* Note: Connect button is usually in navbar, user knows what to do */}
      </div>
    )
  }

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10 min-h-screen">
      <div className="safu-section mb-6">
        <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Portfolio</div>
        <h1 className="text-2xl font-semibold mt-1">Your Tokens & Fees</h1>
        <div className="text-sm text-[var(--subtext)] mt-1">Active raises, deployed tokens, fee claims, and trade activity.</div>
      </div>

      <div className="flex gap-2 overflow-auto pb-2">
        <button className={"tab-btn " + (tab === 'project' ? 'active' : '')} onClick={() => setTab('project')}>
          Project Raise ({projects.length})
        </button>
        <button className={"tab-btn " + (tab === 'instant' ? 'active' : '')} onClick={() => setTab('instant')}>
          Instant Raise ({instantLaunches.length})
        </button>
        <button className={"tab-btn " + (tab === 'activity' ? 'active' : '')} onClick={() => setTab('activity')}>
          Activity
        </button>
      </div>

      <div className="mt-6">
        {loading && <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-[var(--accent)]" /></div>}

        {!loading && tab === 'project' && (
          <div className="space-y-4">
            {projects.map(p => (
              <div key={p.id} className="safu-section">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{p.token.name} <span className="text-[var(--subtext)]">({p.token.symbol})</span></div>
                  <div className="flex items-center gap-2">
                    <span className={`pill ${p.raiseCompleted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {p.raiseCompleted ? 'Completed' : 'Active'}
                    </span>
                    {/* Placeholder for fee claiming if owner */}
                    <button className="btn-ghost text-xs">Manage</button>
                  </div>
                </div>
              </div>
            ))}
            {!projects.length && <div className="text-[var(--subtext)] italic">No project raises found.</div>}
          </div>
        )}

        {!loading && tab === 'instant' && (
          <div className="space-y-4">
            {instantLaunches.map(l => (
              <div key={l.id} className="safu-section">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{l.token.name} <span className="text-[var(--subtext)]">({l.token.symbol})</span></div>
                  <div className="flex items-center gap-2">
                    <span className="pill"><span className="pill-dot"></span>Trading</span>
                    {/* Future: Add claim fees button here */}
                  </div>
                </div>
              </div>
            ))}
            {!instantLaunches.length && <div className="text-[var(--subtext)] italic">No instant launches found.</div>}
          </div>
        )}

        {!loading && tab === 'activity' && (
          <div className="safu-section">
            <div className="text-sm font-semibold">Buy / Sell Activity</div>
            <div className="mt-4 overflow-hidden rounded-3xl border border-[var(--border-soft)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-soft)] text-[var(--subtext)]">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Token</th>
                    <th className="text-left font-medium px-4 py-3">Side</th>
                    <th className="text-right font-medium px-4 py-3">Amount</th>
                    <th className="text-right font-medium px-4 py-3">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)]">
                  {activity.map((a, i) => (
                    <tr key={i} className="hover:bg-[var(--surface-soft)]/60">
                      <td className="px-4 py-3 font-medium">{a.token}</td>
                      <td className={'px-4 py-3 ' + (a.side === 'Buy' ? 'text-[#22c55e]' : 'text-[#ef4444]')}>{a.side}</td>
                      <td className="px-4 py-3 text-right text-[var(--subtext)] tabular-nums">{a.amount}</td>
                      <td className="px-4 py-3 text-right text-[var(--subtext)]">{a.when}</td>
                    </tr>
                  ))}
                  {!activity.length && <tr><td colSpan={4} className="p-4 text-center text-[var(--subtext)]">No activity found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
