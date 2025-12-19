"use client";

import React, { useEffect, useMemo, useState } from "react";

function clamp(n: number, a: number, b: number){ return Math.max(a, Math.min(b, n)); }
function fmtInt(n: number){
  const x = Math.floor(n);
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function humanTime(ts: number){
  const mins = Math.max(1, Math.round((Date.now()-ts)/60000));
  if(mins < 60) return `${mins}m`;
  const h = Math.round(mins/60);
  if(h < 24) return `${h}h`;
  const d = Math.round(h/24);
  return `${d}d`;
}
function randWallet(i: number){
  const a = (0x100000 + (i*7919 % 0xEFFFFF)).toString(16);
  const b = (0x100000 + (i*1543 % 0xEFFFFF)).toString(16);
  return `0x${a.slice(0,4)}…${b.slice(-4)}`;
}

interface ContributorRow {
  id: number;
  wallet: string;
  bnb: number;
  nx: number;
  ts: number;
  topScore: number;
}

interface ConfettiPiece {
  id: string;
  left: number;
  top: number;
  rot: number;
  delay: number;
  opacity: number;
  bg: string;
}

export default function ProjectRaiseTokenPage(){
  // demo state
  const [raised, setRaised] = useState(186);
  const [contributors, setContributors] = useState(214);
  const target = 300;
  const nxPerBnb = 2_500_000; // demo ratio
  const raiseEnd = useMemo(() => Date.now() + (18*60+42)*60*1000, []);
  const vestMonths = 12;
  const initialUnlockPct = 20;

  // participate
  const [bnB, setBnB] = useState(5);
  const [allocBnB, setAllocBnB] = useState(0);

  // tabs
  const tabs = ["overview","contributors","vesting","links","team","creator"];
  const [tab, setTab] = useState("overview");

  // contributors dataset
  const now = useMemo(() => Date.now(), []);
  const dataset = useMemo(() => Array.from({length:97}).map((_,i)=>{
    const bnb = Math.max(0.2, ((Math.sin(i*1.7)+1.3)*4.2) + (i%7===0?9:0));
    const whenMins = (i*13)%1440;
    return {
      id:i+1,
      wallet:randWallet(i+1),
      bnb: Math.round(bnb*10)/10,
      nx: Math.round(bnb*nxPerBnb),
      ts: now - whenMins*60*1000,
      topScore: bnb,
    };
  }), [now]);

  const [seg, setSeg] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const sorted = useMemo(() => {
    const arr = [...dataset];
    if(seg==="top") arr.sort((a,b)=>b.topScore-a.topScore);
    else if(seg==="recent") arr.sort((a,b)=>b.ts-a.ts);
    else arr.sort((a,b)=>b.id-a.id);
    return arr;
  }, [dataset, seg]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(sorted.length/perPage)), [sorted.length]);
  useEffect(()=>{ setPage(1); }, [seg]);

  const pageRows = useMemo(() => {
    const p = clamp(page, 1, totalPages);
    const start = (p-1)*perPage;
    return sorted.slice(start, start+perPage);
  }, [sorted, page, totalPages]);

  // modals
  const [historyOpen, setHistoryOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletRow, setWalletRow] = useState<ContributorRow | null>(null);

  // confetti
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  // vesting
  const monthMs = 30*24*60*60*1000;
  const vestStart = raiseEnd;
  const [clock, setClock] = useState(Date.now());
  useEffect(()=>{
    const id = setInterval(()=> setClock(Date.now()), 2500);
    return ()=> clearInterval(id);
  }, []);
  const elapsed = clock - vestStart;
  const monthsDone = clamp(Math.floor(elapsed / monthMs), 0, vestMonths);
  const unlockedPct = Math.min(100, initialUnlockPct + (monthsDone/vestMonths)*(100-initialUnlockPct));
  const nextTs = vestStart + (monthsDone+1)*monthMs;

  // progress
  const pct = clamp((raised/target)*100, 0, 100);

  // participate calc
  const nxOut = bnB>0 ? `${fmtInt(bnB*nxPerBnb)} NXRA` : "—";
  const allocOut = allocBnB>0 ? `${fmtInt(allocBnB*nxPerBnb)} NXRA` : "—";

  // "Open" label coloring demo
  const raiseState = { text:"Open", color:"#22c55e" };

  const burstConfetti = () => {
    const n = 26;
    const pieces = Array.from({length:n}).map((_,i)=>({
      id: `${Date.now()}-${i}`,
      left: Math.random()*100,
      top: -10 - Math.random()*30,
      rot: Math.random()*180,
      delay: Math.random()*0.18,
      opacity: 0.65 + Math.random()*0.35,
      bg: (i%3===0) ? "#22c55e" : (i%3===1 ? "#ffb000" : "#f97316"),
    }));
    setConfetti(pieces);
    setTimeout(()=> setConfetti([]), 1400);
  };

  const contribute = () => {
    const v = clamp(parseFloat(String(bnB||0)), 0, 25);
    if(v<=0) return;
    setRaised(r => clamp(Math.round((r + Math.round(v*10)/10)*10)/10, 0, target));
    setContributors(c => c+1);
    if((raised+v)/target >= 0.98) burstConfetti();
  };

  const copyContract = async () => {
    try{
      await navigator.clipboard.writeText("0xNEXA...DEMO");
    } catch {}
  };

  return (
    <>
      {/* Confetti */}
      {confetti.length>0 && (
        <div className="confetti">
          {confetti.map(p=>(
            <span key={p.id} style={{
              left:`${p.left}%`, top:`${p.top}px`, transform:`rotate(${p.rot}deg)`,
              animationDelay:`${p.delay}s`, opacity:p.opacity, background:p.bg
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
                  <div className="w-16 h-16 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-soft)] flex items-center justify-center font-semibold">NX</div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-semibold tracking-tight">NEXA</h1>
                      <span className="pill"><span className="pill-dot"></span><span>Live raise</span></span>
                      <span className="pill">72h window</span>
                      <span className="pill" title="Starting Market Cap protected">Starting MC protected</span>
                    </div>
                    <div className="mt-1 text-sm text-[var(--subtext)]">
                      Project Raise · Target: <span className="font-medium text-[var(--text)]">300 BNB</span> · Ends in{" "}
                      <span className="font-medium text-[var(--text)]">18h 42m</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button className="btn-ghost" onClick={copyContract}>Copy contract</button>
                  <button className="btn-ghost" onClick={()=>setHistoryOpen(true)}>Raise history</button>
                </div>
              </div>
            </div>

            {/* Raise Status + Mechanics */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="safu-section space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Raise progress</div>
                    <div className="text-sm text-[var(--subtext)] mt-1">Live contributions update in real time.</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[var(--subtext)]">Raised</div>
                    <div className="text-lg font-semibold">{raised} <span className="text-[var(--subtext)] text-sm">/ {target} BNB</span></div>
                  </div>
                </div>

                <div className="progress"><div style={{ width: `${pct.toFixed(2)}%` }} /></div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
                    <div className="text-[var(--subtext)]">Contributors</div>
                    <div className="mt-1 font-semibold text-[var(--text)]">{contributors}</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
                    <div className="text-[var(--subtext)]">Min–Max</div>
                    <div className="mt-1 font-semibold text-[var(--text)]">100–500</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
                    <div className="text-[var(--subtext)]">Currency</div>
                    <div className="mt-1 font-semibold text-[var(--text)]">BNB</div>
                  </div>
                </div>

                <div className="text-xs text-[var(--subtext)]">
                  Founder unlock: <span className="font-medium text-[var(--text)]">20%</span> at raise end · Remaining released monthly (1y) if MC stays above start.
                </div>
              </div>

              <div className="safu-section">
                <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Mechanics</div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between"><span className="text-[var(--subtext)]">Raise range</span><span className="font-medium">100–500 BNB</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--subtext)]">Raise window</span><span className="font-medium">72 hours</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--subtext)]">Initial liquidity</span><span className="font-medium">10% supply paired</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--subtext)]">Founder payout</span><span className="font-medium">20% raised at end</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--subtext)]">LP fees split</span><span className="font-medium">70% / 20% / 10%</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--subtext)]">Emergency path</span><span className="font-medium">48h timelock</span></div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-nowrap overflow-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tabs.map(t=>(
                <button key={t} className={"tab-btn " + (tab===t ? "active" : "")} onClick={()=>setTab(t)}>
                  {t[0].toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>

            {/* Overview */}
            {tab==="overview" && (
              <div className="safu-section">
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="text-sm text-[var(--subtext)] leading-relaxed">
                      <span className="font-medium text-[var(--text)]">NEXA</span> is raising through SafuPad&apos;s Project Raise model.
                      Contributors receive <span className="font-medium text-[var(--text)]">20% supply</span> at raise end, with remaining unlocks monthly over 12 months if market cap stays above the starting mark.
                    </div>

                    <div className="mt-5 grid sm:grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                        <div className="text-xs text-[var(--subtext)]">Starting MC</div>
                        <div className="mt-1 font-semibold">$1.20M</div>
                      </div>
                      <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                        <div className="text-xs text-[var(--subtext)]">FDV at raise</div>
                        <div className="mt-1 font-semibold">$2.90M</div>
                      </div>
                      <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                        <div className="text-xs text-[var(--subtext)]">Community</div>
                        <div className="mt-1 font-semibold">20% supply</div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Raise timeline</div>
                      <div className="mt-3 grid md:grid-cols-3 gap-3">
                        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                          <div className="text-xs text-[var(--subtext)]">T‑72 → T‑0</div>
                          <div className="mt-1 text-sm">Contribute within the 72h window. Target closes automatically.</div>
                        </div>
                        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                          <div className="text-xs text-[var(--subtext)]">T‑0</div>
                          <div className="mt-1 text-sm">20% unlocks. Liquidity deployed using 10% supply pairing.</div>
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
                      <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Community preview</div>
                      <div className="mt-3 text-sm text-[var(--subtext)]">Your expected allocation (estimate)</div>

                      <div className="mt-3">
                        <div className="text-xs text-[var(--subtext)]">Contribution</div>
                        <div className="mt-1 flex gap-2">
                          <input
                            className="field"
                            inputMode="decimal"
                            placeholder="e.g. 5"
                            value={allocBnB ? String(allocBnB) : ""}
                            onChange={(e)=> setAllocBnB(clamp(parseFloat(e.target.value||"0"),0,25))}
                          />
                          <button className="btn-ghost" onClick={()=> setAllocBnB(25)}>Max</button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs text-[var(--subtext)]">Est. NXRA received</div>
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
            {tab==="contributors" && (
              <div className="safu-section">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Contributors</div>
                    <div className="text-sm text-[var(--subtext)] mt-1">Last activity · 20 per page · wallet details on click.</div>
                  </div>
                  <div className="flex gap-2">
                    {["all","top","recent"].map(s=>(
                      <button
                        key={s}
                        className={"btn-ghost " + (seg===s ? "opacity-100" : "opacity-80")}
                        style={seg===s ? { background:"var(--text)", color:"var(--bg)" } : undefined}
                        onClick={()=>setSeg(s)}
                      >
                        {s[0].toUpperCase()+s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-3xl border border-[var(--border-soft)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--surface-soft)] text-[var(--subtext)]">
                      <tr>
                        <th className="text-left font-medium px-4 py-3">Wallet</th>
                        <th className="text-right font-medium px-4 py-3">BNB</th>
                        <th className="text-right font-medium px-4 py-3">NXRA est.</th>
                        <th className="text-right font-medium px-4 py-3">When</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-soft)]">
                      {pageRows.map(r=>(
                        <tr key={r.id} className="hover:bg-[var(--surface-soft)]/60 cursor-pointer" onClick={()=>{ setWalletRow(r); setWalletOpen(true); }}>
                          <td className="px-4 py-3 font-medium">{r.wallet}</td>
                          <td className="px-4 py-3 text-right">{r.bnb.toFixed(1)}</td>
                          <td className="px-4 py-3 text-right text-[var(--subtext)]">{fmtInt(r.nx)}</td>
                          <td className="px-4 py-3 text-right text-[var(--subtext)]">{humanTime(r.ts)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-[var(--subtext)]">
                    Showing {(page-1)*perPage+1}-{Math.min(page*perPage, sorted.length)} of {sorted.length} ({seg})
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-ghost" disabled={page<=1} onClick={()=>setPage(p=>clamp(p-1,1,totalPages))}>Prev</button>
                    {Array.from({length: Math.min(5,totalPages)}).map((_,i)=>{
                      const start = clamp(page-2, 1, Math.max(1,totalPages-4));
                      const p = start+i;
                      if(p>totalPages) return null;
                      return (
                        <button key={p} className="btn-ghost" style={p===page?{background:"var(--text)",color:"var(--bg)"}:undefined} onClick={()=>setPage(p)}>
                          {p}
                        </button>
                      );
                    })}
                    <button className="btn-ghost" disabled={page>=totalPages} onClick={()=>setPage(p=>clamp(p+1,1,totalPages))}>Next</button>
                  </div>
                </div>
              </div>
            )}

            {/* Vesting */}
            {tab==="vesting" && (
              <div className="safu-section">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Vesting schedule</div>
                    <div className="text-sm text-[var(--subtext)] mt-1">12 monthly unlocks after the initial 20% at raise end.</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-2 text-xs text-[var(--subtext)]">
                    Uses real timestamps (simulated demo clock)
                  </div>
                </div>

                <div className="mt-6 vest-wrap">
                  {Array.from({length: vestMonths}).map((_,i)=>{
                    const pctFill = i < monthsDone ? 100 : (i===monthsDone ? clamp((elapsed - monthsDone*monthMs)/monthMs, 0, 1)*100 : 0);
                    return (
                      <div key={i} className="vest-tick" title={`Month ${i+1}`}>
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
                    <div className="mt-1 font-semibold">{monthsDone >= vestMonths ? "Completed" : new Date(nextTs).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"})}</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                    <div className="text-xs text-[var(--subtext)]">Condition</div>
                    <div className="mt-1 font-semibold">MC ≥ Start</div>
                  </div>
                </div>
              </div>
            )}

            {/* Links */}
            {tab==="links" && (
              <div className="safu-section">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Project</div>
                    <div className="mt-4 space-y-3 text-sm">
                      {[
                        ["Website","nexa.finance"],
                        ["X","@nexa"],
                        ["Telegram","t.me/nexa"],
                      ].map(([k,v])=>(
                        <div key={k} className="flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                          <span className="text-[var(--subtext)]">{k}</span>
                          <a className="font-medium hover:underline" href="#">{v}</a>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Docs</div>
                    <div className="mt-4 space-y-3 text-sm">
                      {[
                        ["Whitepaper","PDF"],
                        ["Audit","Report"],
                        ["Raise terms","View"],
                      ].map(([k,v])=>(
                        <div key={k} className="flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                          <span className="text-[var(--subtext)]">{k}</span>
                          <a className="font-medium hover:underline" href="#">{v}</a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Team */}
            {tab==="team" && (
              <div className="safu-section">
                <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Team</div>
                <div className="mt-4 grid md:grid-cols-3 gap-4">
                  {[
                    ["FM","Founder","Protocol lead"],
                    ["TM","Team","Engineering"],
                    ["TM","Team","Growth"],
                  ].map(([i,n,r])=>(
                    <div key={n+r} className="rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-5">
                      <div className="w-11 h-11 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] flex items-center justify-center font-semibold">{i}</div>
                      <div className="mt-3 font-medium">{n}</div>
                      <div className="text-sm text-[var(--subtext)]">{r}</div>
                      <button className="btn-ghost mt-4 w-full">View profile</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Creator */}
            {tab==="creator" && (
              <div className="safu-section">
                <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-6">
                  <div>
                    <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Creator trust</div>
                    <div className="mt-4 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">0xA54…AC12</div>
                          <div className="text-sm text-[var(--subtext)] mt-1">Verified history · transparent terms · no stealth updates</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[var(--subtext)]">Trust score</div>
                          <div className="text-2xl font-semibold">86<span className="text-sm text-[var(--subtext)]">/100</span></div>
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
                    <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Historical launches</div>
                    <div className="mt-4 overflow-hidden rounded-3xl border border-[var(--border-soft)]">
                      <table className="w-full text-sm">
                        <thead className="bg-[var(--surface-soft)] text-[var(--subtext)]">
                          <tr>
                            <th className="text-left font-medium px-4 py-3">Token</th>
                            <th className="text-right font-medium px-4 py-3">Outcome</th>
                            <th className="text-right font-medium px-4 py-3">Age</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-soft)]">
                          <tr className="hover:bg-[var(--surface-soft)]/60">
                            <td className="px-4 py-3">NEXA</td>
                            <td className="px-4 py-3 text-right"><span className="pill"><span className="pill-dot"></span>Live</span></td>
                            <td className="px-4 py-3 text-right text-[var(--subtext)]">Now</td>
                          </tr>
                          <tr className="hover:bg-[var(--surface-soft)]/60">
                            <td className="px-4 py-3">Nova</td>
                            <td className="px-4 py-3 text-right text-[var(--subtext)]">Graduated</td>
                            <td className="px-4 py-3 text-right text-[var(--subtext)]">4w</td>
                          </tr>
                          <tr className="hover:bg-[var(--surface-soft)]/60">
                            <td className="px-4 py-3">OrbAI</td>
                            <td className="px-4 py-3 text-right text-[var(--subtext)]">Closed</td>
                            <td className="px-4 py-3 text-right text-[var(--subtext)]">3m</td>
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
                  <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Participate</div>
                  <div className="text-sm text-[var(--subtext)] mt-1">Contribute BNB · live NXRA estimate</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[var(--subtext)]">Open</div>
                  <div className="font-medium" style={{ color: raiseState.color }}>{raiseState.text}</div>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-xs text-[var(--subtext)]">Quick amounts</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[1,5,10,25].map(v=>(
                    <button key={v} className="btn-ghost" onClick={()=>setBnB(v)}>{v}</button>
                  ))}
                  <button className="btn-ghost" onClick={()=>setBnB(25)}>Max</button>
                </div>

                <div className="mt-4">
                  <input
                    className="field"
                    inputMode="decimal"
                    placeholder="Enter BNB"
                    value={bnB ? String(bnB) : ""}
                    onChange={(e)=> setBnB(clamp(parseFloat(e.target.value||"0"), 0, 25))}
                  />
                </div>

                <div className="mt-3">
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="0.1"
                    value={bnB}
                    onChange={(e)=> setBnB(clamp(parseFloat(e.target.value), 0, 25))}
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

                <button className="btn-primary mt-5" onClick={contribute} disabled={!bnB || bnB<=0}>
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
        <div className="modal-backdrop" onClick={()=>setHistoryOpen(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--border-soft)] flex items-center justify-between">
              <div>
                <div className="font-medium">Raise history snapshot</div>
                <div className="text-sm text-[var(--subtext)]">Demo view (last 24h)</div>
              </div>
              <button className="btn-ghost" onClick={()=>setHistoryOpen(false)}>Close</button>
            </div>
            <div className="p-5">
              <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-5">
                <div className="flex items-center justify-between text-xs text-[var(--subtext)]">
                  <span>BNB raised</span><span>Updated moments ago</span>
                </div>
                <div className="mt-4 h-28 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] relative overflow-hidden">
                  <svg viewBox="0 0 100 40" className="absolute inset-0 w-full h-full">
                    <path d="M0 30 C 12 26, 22 28, 34 22 S 58 18, 70 16 S 88 10, 100 12" fill="none" stroke="rgba(255,176,0,0.9)" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {walletOpen && walletRow && (
        <div className="modal-backdrop" onClick={()=>setWalletOpen(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--border-soft)] flex items-center justify-between">
              <div>
                <div className="font-medium">{walletRow.wallet}</div>
                <div className="text-sm text-[var(--subtext)]">Contributor details</div>
              </div>
              <button className="btn-ghost" onClick={()=>setWalletOpen(false)}>Close</button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4 flex items-center justify-between">
                <span className="text-[var(--subtext)]">Total contributed</span>
                <span className="font-medium">{walletRow.bnb} BNB</span>
              </div>
              <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4 flex items-center justify-between">
                <span className="text-[var(--subtext)]">Est. NXRA</span>
                <span className="font-medium">{fmtInt(walletRow.nx)} NXRA</span>
              </div>
              <div className="text-xs text-[var(--subtext)]">Demo modal — production pulls on-chain wallet state.</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
