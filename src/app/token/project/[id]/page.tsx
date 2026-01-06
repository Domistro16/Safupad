'use client'

import React, { useEffect, useMemo, useState, use } from "react";
import { useSafuPadSDK } from "@/lib/safupad-sdk";
import { fetchTokenData } from "@/lib/token-utils";
import type { Token } from "@/types/token";
import type { GraphContribution } from "@/safupad/sdk";
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
function humanTimeRemaining(ts: number) {
  const diff = ts - Date.now();
  if (diff <= 0) return "Ended";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${mins}m`;
}

function formatNumber(num: number) {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toFixed(2);
}

function shortenAddress(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

interface ContributorRow {
  id: string;
  wallet: string;
  bnb: number;
  tokens: number;
  ts: number;
  claimed: boolean;
}

export default function ProjectRaiseTokenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { sdk, connect } = useSafuPadSDK();

  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Contributors data
  const [contributors, setContributors] = useState<ContributorRow[]>([]);
  const [contributorsLoading, setContributorsLoading] = useState(false);

  // Participate state
  const [bnB, setBnB] = useState(0);
  const [allocBnB, setAllocBnB] = useState(0);

  // Tabs
  const tabs = ["overview", "contributors", "vesting", "links", "team", "creator"];
  const [tab, setTab] = useState("overview");

  // Contributors pagination and sorting
  const [seg, setSeg] = useState<"all" | "top" | "recent">("all");
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Modals
  const [historyOpen, setHistoryOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletRow, setWalletRow] = useState<ContributorRow | null>(null);

  // Confetti
  const [confetti, setConfetti] = useState<Array<{ id: string; left: number; top: number; rot: number; delay: number; opacity: number; bg: string }>>([]);

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

  // Load contributors from SDK Graph
  useEffect(() => {
    let cancelled = false;
    const loadContributors = async () => {
      if (!sdk || !token) return;
      try {
        setContributorsLoading(true);
        // @ts-ignore - graph may not be typed
        const graphContributions: GraphContribution[] = await sdk.graph?.getContributions(id, { first: 100 }) || [];

        const rows: ContributorRow[] = graphContributions.map((c, i) => ({
          id: c.id || String(i),
          wallet: c.contributor,
          bnb: Number(ethers.formatEther(c.amount || "0")),
          tokens: Number(ethers.formatEther(c.amount || "0")) * (token?.currentPrice ? (1 / token.currentPrice) : 2500000),
          ts: Number(c.timestamp || "0") * 1000,
          claimed: c.claimed || false,
        }));

        if (!cancelled) setContributors(rows);
      } catch (err) {
        console.warn("Could not load contributors:", err);
        if (!cancelled) setContributors([]);
      } finally {
        if (!cancelled) setContributorsLoading(false);
      }
    };
    loadContributors();
    return () => { cancelled = true; };
  }, [sdk, token, id]);

  // Derived state from real token data
  const projectRaise = token?.projectRaise;
  const raised = projectRaise?.raisedAmount || 0;
  const target = projectRaise?.targetAmount || 100;
  const nxPerBnb = token?.currentPrice ? (1 / token.currentPrice) : 2_500_000;
  const raiseEnd = projectRaise?.endTime ? projectRaise.endTime.getTime() : Date.now();
  const vestMonths = projectRaise?.config?.vestingMonths || 12;
  const initialUnlockPct = projectRaise?.config?.immediateUnlock || 20;

  // Vesting calculations
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const vestStart = raiseEnd;
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setClock(Date.now()), 2500);
    return () => clearInterval(interval);
  }, []);

  const elapsed = clock - vestStart;
  const monthsDone = clamp(Math.floor(elapsed / monthMs), 0, vestMonths);
  const unlockedPct = clamp(initialUnlockPct + (monthsDone / vestMonths) * (100 - initialUnlockPct), 0, 100);
  const nextTs = vestStart + (monthsDone + 1) * monthMs;

  const pct = clamp((raised / target) * 100, 0, 100);

  const nxOut = bnB > 0 ? `${fmtInt(bnB * nxPerBnb)} ${token?.symbol || 'TOKEN'}` : "—";
  const allocOut = allocBnB > 0 ? `${fmtInt(allocBnB * nxPerBnb)} ${token?.symbol || 'TOKEN'}` : "—";

  const raiseState = token?.status === "active"
    ? { text: "Open", color: "#22c55e" }
    : (token?.status === "completed" || token?.graduated ? { text: "Closed", color: "#64748b" } : { text: "Upcoming", color: "#f59e0b" });

  // Sorted contributors
  const sorted = useMemo(() => {
    const arr = [...contributors];
    if (seg === "top") arr.sort((a, b) => b.bnb - a.bnb);
    else if (seg === "recent") arr.sort((a, b) => b.ts - a.ts);
    else arr.sort((a, b) => b.ts - a.ts); // default: recent
    return arr;
  }, [contributors, seg]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(sorted.length / perPage)), [sorted.length]);
  useEffect(() => { setPage(1); }, [seg]);

  const pageRows = useMemo(() => {
    const p = clamp(page, 1, totalPages);
    const start = (p - 1) * perPage;
    return sorted.slice(start, start + perPage);
  }, [sorted, page, totalPages]);

  // Confetti burst
  const burstConfetti = () => {
    const n = 26;
    const pieces = Array.from({ length: n }).map((_, i) => ({
      id: `${Date.now()}-${i}`,
      left: Math.random() * 100,
      top: -10 - Math.random() * 30,
      rot: Math.random() * 180,
      delay: Math.random() * 0.18,
      opacity: 0.65 + Math.random() * 0.35,
      bg: (i % 3 === 0) ? "#22c55e" : (i % 3 === 1 ? "#ffb000" : "#f97316"),
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 1400);
  };

  const contribute = async () => {
    if (!sdk || !token) return;
    try {
      const tx = await sdk.launchpad.contribute(token.id, String(bnB));
      await tx.wait();
      // Reload data
      const fresh = await fetchTokenData(sdk, id);
      setToken(fresh);
      setBnB(0);
      // Check if near completion
      if (fresh && fresh.projectRaise && (fresh.projectRaise.raisedAmount / fresh.projectRaise.targetAmount) >= 0.98) {
        burstConfetti();
      }
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
      {/* Confetti */}
      {confetti.length > 0 && (
        <div className="confetti">
          {confetti.map(p => (
            <span key={p.id} style={{
              left: `${p.left}%`, top: `${p.top}px`, transform: `rotate(${p.rot}deg)`,
              animationDelay: `${p.delay}s`, opacity: p.opacity, background: p.bg
            }} />
          ))}
        </div>
      )}

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
                      <span className="pill">{humanTimeRemaining(raiseEnd)} left</span>
                      <span className="pill" title="Starting Market Cap protected">Starting MC protected</span>
                    </div>
                    <div className="mt-1 text-sm text-[var(--subtext)]">
                      Project Raise · Target: <span className="font-medium text-[var(--text)]">{formatNumber(target)} BNB</span> · Ends in{" "}
                      <span className="font-medium text-[var(--text)]">{humanTimeRemaining(raiseEnd)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button className="btn-ghost" onClick={copyContract}>Copy contract</button>
                  <button className="btn-ghost" onClick={() => setHistoryOpen(true)}>Raise history</button>
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
                    <div className="mt-1 font-semibold text-[var(--text)]">{contributors.length || token.holders || 0}</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
                    <div className="text-[var(--subtext)]">Min–Max</div>
                    <div className="mt-1 font-semibold text-[var(--text)]">0.1–25</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
                    <div className="text-[var(--subtext)]">Currency</div>
                    <div className="mt-1 font-semibold text-[var(--text)]">BNB</div>
                  </div>
                </div>

                <div className="text-xs text-[var(--subtext)]">
                  Founder unlock: <span className="font-medium text-[var(--text)]">{initialUnlockPct}%</span> at raise end · Remaining released monthly ({vestMonths} months) if MC stays above start.
                </div>
              </div>

              <div className="safu-section">
                <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">Mechanics</div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between"><span className="text-[var(--subtext)]">Raise range</span><span className="font-medium">0.1–25 BNB</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--subtext)]">Raise window</span><span className="font-medium">72 hours</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--subtext)]">Initial liquidity</span><span className="font-medium">{projectRaise?.config?.liquidityAllocation || 10}% supply paired</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--subtext)]">Founder payout</span><span className="font-medium">{projectRaise?.config?.ownerAllocation || 20}% raised at end</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--subtext)]">LP fees split</span><span className="font-medium">70% / 20% / 10%</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--subtext)]">Emergency path</span><span className="font-medium">48h timelock</span></div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-nowrap overflow-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tabs.map(t => (
                <button key={t} className={"tab-btn " + (tab === t ? "active" : "")} onClick={() => setTab(t)}>
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Overview */}
            {tab === "overview" && (
              <div className="safu-section">
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="text-sm text-[var(--subtext)] leading-relaxed">
                      <span className="font-medium text-[var(--text)]">{token.name}</span> is raising through SafuPad's Project Raise model.
                      Contributors receive <span className="font-medium text-[var(--text)]">{100 - (projectRaise?.config?.ownerAllocation || 60)}% supply</span> at raise end, with remaining unlocks monthly over {vestMonths} months if market cap stays above the starting mark.
                    </div>
                    {token.description && (
                      <div className="mt-4 text-sm text-[var(--subtext)] leading-relaxed">{token.description}</div>
                    )}

                    <div className="mt-5 grid sm:grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                        <div className="text-xs text-[var(--subtext)]">Starting MC</div>
                        <div className="mt-1 font-semibold">${formatNumber(token.startingMarketCap || token.marketCap)}</div>
                      </div>
                      <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                        <div className="text-xs text-[var(--subtext)]">FDV at raise</div>
                        <div className="mt-1 font-semibold">${formatNumber(token.currentPrice * token.totalSupply)}</div>
                      </div>
                      <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                        <div className="text-xs text-[var(--subtext)]">Community</div>
                        <div className="mt-1 font-semibold">{100 - (projectRaise?.config?.ownerAllocation || 60)}% supply</div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">Raise timeline</div>
                      <div className="mt-3 grid md:grid-cols-3 gap-3">
                        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                          <div className="text-xs text-[var(--subtext)]">T‑72 → T‑0</div>
                          <div className="mt-1 text-sm">Contribute within the 72h window. Target closes automatically.</div>
                        </div>
                        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                          <div className="text-xs text-[var(--subtext)]">T‑0</div>
                          <div className="mt-1 text-sm">{initialUnlockPct}% unlocks. Liquidity deployed using {projectRaise?.config?.liquidityAllocation || 10}% supply pairing.</div>
                        </div>
                        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                          <div className="text-xs text-[var(--subtext)]">Post‑raise</div>
                          <div className="mt-1 text-sm">Monthly vesting continues while MC stays above start.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-5">
                      <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">Community preview</div>
                      <div className="mt-3 text-sm text-[var(--subtext)]">Your expected allocation (estimate)</div>

                      <div className="mt-3">
                        <div className="text-xs text-[var(--subtext)]">Contribution</div>
                        <div className="mt-1 flex gap-2">
                          <input
                            className="field"
                            inputMode="decimal"
                            placeholder="e.g. 5"
                            value={allocBnB ? String(allocBnB) : ""}
                            onChange={(e) => setAllocBnB(clamp(parseFloat(e.target.value || "0"), 0, 25))}
                          />
                          <button className="btn-ghost" onClick={() => setAllocBnB(25)}>Max</button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs text-[var(--subtext)]">Est. {token.symbol} received</div>
                        <div className="mt-1 text-xl font-semibold">{allocOut}</div>
                        <div className="mt-2 text-xs text-[var(--subtext)]">Includes post‑raise vesting schedule.</div>
                      </div>

                      <div className="mt-4">
                        <button className="btn-primary" disabled>Claim preview (post‑raise)</button>
                        <div className="mt-2 text-xs text-[var(--subtext)] text-center">Claims activate after raise end.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contributors */}
            {tab === "contributors" && (
              <div className="safu-section">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">Contributors</div>
                    <div className="text-sm text-[var(--subtext)] mt-1">Last activity · {perPage} per page · wallet details on click.</div>
                  </div>
                  <div className="flex gap-2">
                    {(["all", "top", "recent"] as const).map(s => (
                      <button
                        key={s}
                        className={"btn-ghost " + (seg === s ? "opacity-100" : "opacity-80")}
                        style={seg === s ? { background: "var(--text)", color: "var(--bg)" } : undefined}
                        onClick={() => setSeg(s)}
                      >
                        {s[0].toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {contributorsLoading ? (
                  <div className="mt-5 flex items-center justify-center py-10">
                    <Loader2 className="animate-spin w-6 h-6 text-[var(--accent)]" />
                  </div>
                ) : contributors.length === 0 ? (
                  <div className="mt-5 text-center py-10 text-[var(--subtext)]">No contributors yet. Be the first!</div>
                ) : (
                  <>
                    <div className="mt-5 overflow-hidden rounded-3xl border border-[var(--border-soft)]">
                      <table className="w-full text-sm">
                        <thead className="bg-[var(--surface-soft)] text-[var(--subtext)]">
                          <tr>
                            <th className="text-left font-medium px-4 py-3">Wallet</th>
                            <th className="text-right font-medium px-4 py-3">BNB</th>
                            <th className="text-right font-medium px-4 py-3">{token.symbol} est.</th>
                            <th className="text-right font-medium px-4 py-3">When</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-soft)]">
                          {pageRows.map(r => (
                            <tr key={r.id} className="hover:bg-[var(--surface-soft)]/60 cursor-pointer" onClick={() => { setWalletRow(r); setWalletOpen(true); }}>
                              <td className="px-4 py-3 font-medium">{shortenAddress(r.wallet)}</td>
                              <td className="px-4 py-3 text-right">{r.bnb.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right text-[var(--subtext)]">{fmtInt(r.tokens)}</td>
                              <td className="px-4 py-3 text-right text-[var(--subtext)]">{humanTime(r.ts)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-[var(--subtext)]">
                        Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, sorted.length)} of {sorted.length} ({seg})
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(p => clamp(p - 1, 1, totalPages))}>Prev</button>
                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                          const start = clamp(page - 2, 1, Math.max(1, totalPages - 4));
                          const p = start + i;
                          if (p > totalPages) return null;
                          return (
                            <button key={p} className="btn-ghost" style={p === page ? { background: "var(--text)", color: "var(--bg)" } : undefined} onClick={() => setPage(p)}>
                              {p}
                            </button>
                          );
                        })}
                        <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => clamp(p + 1, 1, totalPages))}>Next</button>
                      </div>
                    </div>
                  </>
                )}
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
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-2 text-xs text-[var(--subtext)]">
                    Uses real timestamps
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
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                    <div className="text-xs text-[var(--subtext)]">Condition</div>
                    <div className="mt-1 font-semibold">MC ≥ Start</div>
                  </div>
                </div>
              </div>
            )}

            {/* Links */}
            {tab === "links" && (
              <div className="safu-section">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">Project</div>
                    <div className="mt-4 space-y-3 text-sm">
                      {token.website && (
                        <div className="flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                          <span className="text-[var(--subtext)]">Website</span>
                          <a className="font-medium hover:underline" href={token.website} target="_blank" rel="noopener noreferrer">{token.website.replace(/^https?:\/\//, '')}</a>
                        </div>
                      )}
                      {token.twitter && (
                        <div className="flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                          <span className="text-[var(--subtext)]">X</span>
                          <a className="font-medium hover:underline" href={token.twitter} target="_blank" rel="noopener noreferrer">{token.twitter.includes('twitter.com') ? '@' + token.twitter.split('/').pop() : token.twitter}</a>
                        </div>
                      )}
                      {token.telegram && (
                        <div className="flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                          <span className="text-[var(--subtext)]">Telegram</span>
                          <a className="font-medium hover:underline" href={token.telegram} target="_blank" rel="noopener noreferrer">{token.telegram.replace(/^https?:\/\//, '')}</a>
                        </div>
                      )}
                      {!token.website && !token.twitter && !token.telegram && (
                        <div className="text-[var(--subtext)]">No project links available.</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">Docs</div>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                        <span className="text-[var(--subtext)]">Contract</span>
                        <a className="font-medium hover:underline" href={`https://bscscan.com/address/${token.contractAddress}`} target="_blank" rel="noopener noreferrer">BscScan</a>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                        <span className="text-[var(--subtext)]">Raise terms</span>
                        <span className="font-medium">Project Raise</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Team */}
            {tab === "team" && (
              <div className="safu-section">
                <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">Team</div>
                <div className="mt-4 grid md:grid-cols-3 gap-4">
                  <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-5">
                    <div className="w-11 h-11 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] flex items-center justify-center font-semibold">FM</div>
                    <div className="mt-3 font-medium">Founder</div>
                    <div className="text-sm text-[var(--subtext)]">{shortenAddress(token.creatorAddress)}</div>
                    <a href={`https://bscscan.com/address/${token.creatorAddress}`} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-4 w-full block text-center">View on BscScan</a>
                  </div>
                </div>
                <div className="mt-4 text-xs text-[var(--subtext)]">Team information is derived from on-chain data. Additional team members may be added via token metadata.</div>
              </div>
            )}

            {/* Creator */}
            {tab === "creator" && (
              <div className="safu-section">
                <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-6">
                  <div>
                    <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">Creator trust</div>
                    <div className="mt-4 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{shortenAddress(token.creatorAddress)}</div>
                          <div className="text-sm text-[var(--subtext)] mt-1">Verified history · transparent terms · no stealth updates</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[var(--subtext)]">Trust score</div>
                          <div className="text-2xl font-semibold">—<span className="text-sm text-[var(--subtext)]">/100</span></div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="pill">✓ Terms published</span>
                        <span className="pill">✓ No emergency triggers</span>
                        <span className="pill">✓ LP fee schedule</span>
                        <span className="pill">⚠ MC guard enabled</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">Current launch</div>
                    <div className="mt-4 overflow-hidden rounded-3xl border border-[var(--border-soft)]">
                      <table className="w-full text-sm">
                        <thead className="bg-[var(--surface-soft)] text-[var(--subtext)]">
                          <tr>
                            <th className="text-left font-medium px-4 py-3">Token</th>
                            <th className="text-right font-medium px-4 py-3">Status</th>
                            <th className="text-right font-medium px-4 py-3">Progress</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-soft)]">
                          <tr className="hover:bg-[var(--surface-soft)]/60">
                            <td className="px-4 py-3">{token.name}</td>
                            <td className="px-4 py-3 text-right"><span className="pill"><span className="pill-dot"></span>{token.status === "active" ? "Live" : token.status}</span></td>
                            <td className="px-4 py-3 text-right text-[var(--subtext)]">{pct.toFixed(0)}%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
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
                  <div className="text-sm text-[var(--subtext)] mt-1">Contribute BNB · live {token.symbol} estimate</div>
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
                  <button className="btn-ghost" onClick={() => setBnB(25)}>Max</button>
                </div>

                <div className="mt-4">
                  <input
                    className="field"
                    inputMode="decimal"
                    placeholder="Enter BNB"
                    value={bnB || ""}
                    onChange={(e) => setBnB(clamp(parseFloat(e.target.value || "0"), 0, 25))}
                  />
                </div>

                <div className="mt-3">
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="0.1"
                    value={bnB}
                    onChange={(e) => setBnB(clamp(parseFloat(e.target.value), 0, 25))}
                    className="w-full"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-[var(--subtext)]">
                    <span>0</span>
                    <span>25 BNB max per tx</span>
                  </div>
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
                  Note: After raise end, claims activate and vesting begins automatically.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Raise History Modal */}
      {historyOpen && (
        <div className="modal-backdrop" onClick={() => setHistoryOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--border-soft)] flex items-center justify-between">
              <div>
                <div className="font-medium">Raise history snapshot</div>
                <div className="text-sm text-[var(--subtext)]">Cumulative contributions over time</div>
              </div>
              <button className="btn-ghost" onClick={() => setHistoryOpen(false)}>Close</button>
            </div>
            <div className="p-5">
              <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-5">
                <div className="flex items-center justify-between text-xs text-[var(--subtext)]">
                  <span>BNB raised</span><span>Updated moments ago</span>
                </div>
                <div className="mt-4 h-28 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] relative overflow-hidden">
                  <svg viewBox="0 0 100 40" className="absolute inset-0 w-full h-full">
                    <path d="M0 30 C 12 26, 22 28, 34 22 S 58 18, 70 16 S 88 10, 100 12" fill="none" stroke="rgba(255,176,0,0.9)" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="mt-3 text-center text-sm text-[var(--subtext)]">
                  Total raised: <span className="font-medium text-[var(--text)]">{formatNumber(raised)} BNB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {walletOpen && walletRow && (
        <div className="modal-backdrop" onClick={() => setWalletOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--border-soft)] flex items-center justify-between">
              <div>
                <div className="font-medium">{shortenAddress(walletRow.wallet)}</div>
                <div className="text-sm text-[var(--subtext)]">Contributor details</div>
              </div>
              <button className="btn-ghost" onClick={() => setWalletOpen(false)}>Close</button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4 flex items-center justify-between">
                <span className="text-[var(--subtext)]">Total contributed</span>
                <span className="font-medium">{walletRow.bnb.toFixed(2)} BNB</span>
              </div>
              <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4 flex items-center justify-between">
                <span className="text-[var(--subtext)]">Est. {token.symbol}</span>
                <span className="font-medium">{fmtInt(walletRow.tokens)} {token.symbol}</span>
              </div>
              <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4 flex items-center justify-between">
                <span className="text-[var(--subtext)]">Claimed</span>
                <span className="font-medium">{walletRow.claimed ? "Yes" : "No"}</span>
              </div>
              <a href={`https://bscscan.com/address/${walletRow.wallet}`} target="_blank" rel="noopener noreferrer" className="btn-ghost w-full block text-center mt-4">View on BscScan</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
