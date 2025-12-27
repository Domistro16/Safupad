'use client'

import React, { useEffect, useMemo, useState, use } from "react";
import { useSafuPadSDK } from "@/lib/safupad-sdk";
import { fetchTokenData } from "@/lib/token-utils";
import type { Token } from "@/types/token";
import { ethers } from "ethers";
import { Loader2 } from "lucide-react";

function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }
function fmtInt(n: number) {
  const x = Math.floor(n);
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function humanTime(ts: number) {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}

// Helper to format large numbers
function formatNumber(num: number) {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}


export default function ProjectRaiseTokenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { sdk, connect } = useSafuPadSDK();

  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // participate
  const [bnB, setBnB] = useState(0);
  const [allocBnB, setAllocBnB] = useState(0);

  // tabs
  const tabs = ["overview", "contributors", "vesting", "links", "team", "creator"];
  const [tab, setTab] = useState("overview");

  // Data loading
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!sdk) return;
      try {
        setLoading(true);
        const data = await fetchTokenData(sdk, id);
        if (!cancelled) setToken(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; }
  }, [sdk, id]);


  // Derived state from real token data
  const projectRaise = token?.projectRaise;

  const raised = projectRaise?.raisedAmount || 0;
  // Use config targetAmount if available, default to something reasonable or 0
  const target = projectRaise?.targetAmount || 100;

  // Example hardcoded conversion rate if not available, or derive from price
  const nxPerBnb = token?.currentPrice ? (1 / token.currentPrice) : 2_500_000;

  const raiseEnd = projectRaise?.endTime ? projectRaise.endTime.getTime() : Date.now();
  const vestMonths = projectRaise?.config?.vestingMonths || 12;
  const initialUnlockPct = projectRaise?.config?.immediateUnlock || 20;

  // Vesting calculations
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const vestStart = raiseEnd; // Assuming vesting starts after raise end
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 2500);
    return () => clearInterval(id);
  }, []);

  const elapsed = clock - vestStart;
  const monthsDone = clamp(Math.floor(elapsed / monthMs), 0, vestMonths);
  // unlockedPct calculation logic
  const unlockedPct = clamp(initialUnlockPct + (monthsDone / vestMonths) * (100 - initialUnlockPct), 0, 100);
  const nextTs = vestStart + (monthsDone + 1) * monthMs;

  const pct = clamp((raised / target) * 100, 0, 100);

  const nxOut = bnB > 0 ? `${fmtInt(bnB * nxPerBnb)} ${token?.symbol || 'TOKEN'}` : "—";
  const allocOut = allocBnB > 0 ? `${fmtInt(allocBnB * nxPerBnb)} ${token?.symbol || 'TOKEN'}` : "—";

  const raiseState = token?.status === "active"
    ? { text: "Open", color: "#22c55e" }
    : (token?.status === "completed" || token?.graduated ? { text: "Closed", color: "#64748b" } : { text: "Upcoming", color: "#f59e0b" });

  const contribute = async () => {
    if (!sdk || !token) return;
    try {
      const tx = await sdk.launchpad.contribute(token.id, String(bnB));
      await tx.wait();
      // reload data
      const fresh = await fetchTokenData(sdk, id);
      setToken(fresh);
      setBnB(0);
      // show success logic here (confetti etc)
    } catch (e: any) {
      console.error("Contribution failed", e);
      alert("Contribution failed: " + (e.message || String(e)));
    }
  };

  const copyContract = async () => {
    try {
      await navigator.clipboard.writeText(token?.contractAddress || "");
    } catch { }
  };

  if (!sdk) {
    return <div className="flex h-screen items-center justify-center"><button onClick={() => connect()} className="btn-primary">Connect Wallet to View</button></div>;
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-[var(--accent)]" /></div>;
  }

  if (error || !token) {
    return <div className="flex h-screen items-center justify-center text-red-500">Error: {error || "Token not found"}</div>
  }

  return (
    <>
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* LEFT */}
          <div className="space-y-6">
            {/* Token header */}
            <div className="safu-section">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {token.image ? (
                    <img src={token.image} alt={token.name} className="w-16 h-16 rounded-2xl bg-[var(--surface-soft)] object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-soft)] flex items-center justify-center font-semibold">{token.symbol.slice(0, 2)}</div>
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-semibold tracking-tight">{token.name}</h1>
                      <span className="pill"><span className="pill-dot"></span><span>{token.status === "active" ? "Live raise" : token.status}</span></span>
                      <span className="pill" title="Time remaining">{humanTime(raiseEnd)} left</span>
                    </div>
                    <div className="mt-1 text-sm text-[var(--subtext)]">
                      Project Raise · Target: <span className="font-medium text-[var(--text)]">{formatNumber(target)} BNB</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button className="btn-ghost" onClick={copyContract}>Copy contract</button>
                  {/* <button className="btn-ghost" onClick={() => setHistoryOpen(true)}>Raise history</button> */}
                </div>
              </div>
            </div>

            {/* Raise Status + Mechanics */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="safu-section space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">Raise progress</div>
                    <div className="text-sm text-[var(--subtext)] mt-1">Live contributions update in real time.</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[var(--subtext)]">Raised</div>
                    <div className="text-lg font-semibold">{formatNumber(raised)} <span className="text-[var(--subtext)] text-sm">/ {formatNumber(target)} BNB</span></div>
                  </div>
                </div>

                <div className="progress"><div style={{ width: `${pct.toFixed(2)}%` }} /></div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
                    <div className="text-[var(--subtext)]">Contributors</div>
                    <div className="mt-1 font-semibold text-[var(--text)]">{token.holders || 0}</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
                    <div className="text-[var(--subtext)]">My Allocation</div>
                    {/* Placeholder for user allocation */}
                    <div className="mt-1 font-semibold text-[var(--text)]">-</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
                    <div className="text-[var(--subtext)]">Currency</div>
                    <div className="mt-1 font-semibold text-[var(--text)]">BNB</div>
                  </div>
                </div>

                <div className="text-xs text-[var(--subtext)]">
                  Founder unlock: <span className="font-medium text-[var(--text)]">{initialUnlockPct}%</span> at raise end · Remaining released monthly.
                </div>
              </div>

              <div className="safu-section">
                <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">Mechanics</div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between"><span className="text-[var(--subtext)]">Raise window</span><span className="font-medium">24h (Default)</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--subtext)]">Initial liquidity</span><span className="font-medium">{projectRaise?.config?.liquidityAllocation || 10}% supply</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--subtext)]">Founder payout</span><span className="font-medium">{projectRaise?.config?.ownerAllocation || 20}% raised</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--subtext)]">Platform fee</span><span className="font-medium">{projectRaise?.config?.tradingFee?.platform || 0}%</span></div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-nowrap overflow-auto pb-1">
              {tabs.map(t => (
                <button key={t} className={"tab-btn " + (tab === t ? "active" : "")} onClick={() => setTab(t)}>
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Overview */}
            {tab === "overview" && (
              <div className="safu-section">
                <div className="text-sm text-[var(--subtext)] leading-relaxed">
                  {token.description}
                </div>

                <div className="mt-5 grid sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                    <div className="text-xs text-[var(--subtext)]">Market Cap</div>
                    <div className="mt-1 font-semibold">${formatNumber(token.marketCap)}</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                    <div className="text-xs text-[var(--subtext)]">Price</div>
                    <div className="mt-1 font-semibold">${(token.currentPrice || 0).toFixed(6)}</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                    <div className="text-xs text-[var(--subtext)]">Total Supply</div>
                    <div className="mt-1 font-semibold">{formatNumber(token.totalSupply)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Vesting */}
            {tab === "vesting" && (
              <div className="safu-section">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">Vesting schedule</div>
                    <div className="text-sm text-[var(--subtext)] mt-1">{vestMonths} monthly unlocks after the initial {initialUnlockPct}% at raise end.</div>
                  </div>
                </div>

                <div className="mt-6 vest-wrap">
                  {Array.from({ length: vestMonths }).map((_, i) => {
                    const pctFill = i < monthsDone ? 100 : (i === monthsDone ? clamp((elapsed - monthsDone * monthMs) / monthMs, 0, 1) * 100 : 0);
                    return (
                      <div key={i} className="vest-tick" title={`Month ${i + 1}`}>
                        <div className="fill" style={{ width: `${pctFill.toFixed(1)}%` }} />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 grid md:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                    <div className="text-xs text-[var(--subtext)]">Unlocked now</div>
                    <div className="mt-1 font-semibold">{unlockedPct.toFixed(1)}%</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                    <div className="text-xs text-[var(--subtext)]">Next unlock</div>
                    <div className="mt-1 font-semibold">{monthsDone >= vestMonths ? "Completed" : new Date(nextTs).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Links */}
            {tab === "links" && (
              <div className="safu-section">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">Socials</div>
                    <div className="mt-4 space-y-3 text-sm">
                      {token.website && (
                        <div className="flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                          <span className="text-[var(--subtext)]">Website</span>
                          <a className="font-medium hover:underline" href={token.website} target="_blank">{token.website}</a>
                        </div>
                      )}
                      {token.twitter && (
                        <div className="flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                          <span className="text-[var(--subtext)]">Twitter</span>
                          <a className="font-medium hover:underline" href={token.twitter} target="_blank">{token.twitter}</a>
                        </div>
                      )}
                      {token.telegram && (
                        <div className="flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                          <span className="text-[var(--subtext)]">Telegram</span>
                          <a className="font-medium hover:underline" href={token.telegram} target="_blank">{token.telegram}</a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs placeholders */}
            {tab === "contributors" && <div className="safu-section text-[var(--subtext)]">Contributor list coming soon (requires Graph integration).</div>}
            {tab === "team" && <div className="safu-section text-[var(--subtext)]">Team info not available in demo.</div>}
            {tab === "creator" && (
              <div className="safu-section">
                <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-5">
                  <div className="text-xs text-[var(--subtext)]">Creator Address</div>
                  <div className="font-medium break-all">{token.creatorAddress}</div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT: Participate */}
          <div className="w-full lg:w-[380px]">
            <div className="safu-section sticky top-24">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">Participate</div>
                  <div className="text-sm text-[var(--subtext)] mt-1">Contribute BNB · live estimate</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[var(--subtext)]">Status</div>
                  <div className="font-medium" style={{ color: raiseState.color }}>{raiseState.text}</div>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-xs text-[var(--subtext)]">Quick amounts</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[1, 5, 10, 25].map(v => (
                    <button key={v} className="btn-ghost" onClick={() => setBnB(v)}>{v}</button>
                  ))}
                </div>

                <div className="mt-4">
                  <input
                    className="field"
                    inputMode="decimal"
                    placeholder="Enter BNB"
                    value={bnB || ""}
                    onChange={(e) => setBnB(Math.max(0, parseFloat(e.target.value || "0")))}
                  />
                </div>

                <div className="mt-5 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--subtext)]">You receive</span>
                    <span className="font-semibold">{nxOut}</span>
                  </div>
                  <div className="mt-2 text-xs text-[var(--subtext)]">Estimated based on current raise ratio.</div>
                </div>

                <button className="btn-primary mt-5" onClick={contribute} disabled={!bnB || bnB <= 0 || token.status !== 'active'}>
                  Contribute to raise
                </button>
                <div className="mt-3 text-xs text-[var(--subtext)] text-center">
                  Funds are converted to tokens at the end of the raise.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
