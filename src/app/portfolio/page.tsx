"use client";

import { useMemo, useState } from 'react'

type Tab = 'project' | 'instant' | 'activity'

interface ActivityItem {
  token: string;
  side: string;
  amount: string;
  when: string;
}

export default function SafuPortfolioPage() {
  const [tab, setTab] = useState<Tab>('project')

  const activity: ActivityItem[] = useMemo(() => ([
    { token: 'NEXA', side: 'Buy', amount: '1.20 BNB', when: '2m ago' },
    { token: 'Nova', side: 'Sell', amount: '0.80 BNB', when: '14m ago' },
    { token: 'NEXA', side: 'Buy', amount: '0.40 BNB', when: '1h ago' },
  ]), [])

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
      <div className="safu-section mb-6">
        <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Portfolio</div>
        <h1 className="text-2xl font-semibold mt-1">Your Tokens & Fees</h1>
        <div className="text-sm text-[var(--subtext)] mt-1">Active raises, deployed tokens, fee claims, and trade activity.</div>
      </div>

      <div className="flex gap-2 overflow-auto pb-2">
        <button className={"tab-btn " + (tab === 'project' ? 'active' : '')} onClick={() => setTab('project')}>Project Raise</button>
        <button className={"tab-btn " + (tab === 'instant' ? 'active' : '')} onClick={() => setTab('instant')}>Instant Raise</button>
        <button className={"tab-btn " + (tab === 'activity' ? 'active' : '')} onClick={() => setTab('activity')}>Activity</button>
      </div>

      <div className="mt-6">
        {tab === 'project' && (
          <div className="safu-section">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">NEXA</div>
              <div className="flex items-center gap-2">
                <span className="pill">Ended</span>
                <button className="btn-ghost">Claim fees</button>
              </div>
            </div>
            <div className="mt-3 text-sm text-[var(--subtext)]">If a Project Raise is live, this shows status. If ended, it shows Claim Fees.</div>
          </div>
        )}

        {tab === 'instant' && (
          <div className="safu-section">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">Nova</div>
              <div className="flex items-center gap-2">
                <span className="pill"><span className="pill-dot"></span>Trading</span>
                <button className="btn-ghost">Claim fees</button>
              </div>
            </div>
            <div className="mt-3 text-sm text-[var(--subtext)]">Instant Raises can be created alongside Project Raises and claim fees independently.</div>
          </div>
        )}

        {tab === 'activity' && (
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
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
