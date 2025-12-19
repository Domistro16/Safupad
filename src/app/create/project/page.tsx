"use client";

import { useMemo, useState } from 'react'

type Tab = 'project' | 'founder' | 'links' | 'team' | 'review'

export default function ProjectRaiseApplicationPage() {
  const [tab, setTab] = useState<Tab>('project')
  const [iconName, setIconName] = useState('')
  const fixed = useMemo(() => ({
    window: '72 hours',
    supply: '1,000,000,000',
    allocation: 'Fixed presets',
  }), [])

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
      <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
        <div className="space-y-6">
          <div className="safu-section">
            <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Application</div>
            <h1 className="text-2xl font-semibold mt-1">Project Raise</h1>
            <div className="text-sm text-[var(--subtext)] mt-2">Fill required details. Fixed parameters cannot be changed.</div>

            <div className="mt-4 grid sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                <div className="text-xs text-[var(--subtext)]">Raise window</div>
                <div className="mt-1 font-semibold">{fixed.window}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                <div className="text-xs text-[var(--subtext)]">Token supply</div>
                <div className="mt-1 font-semibold">{fixed.supply}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                <div className="text-xs text-[var(--subtext)]">Allocation</div>
                <div className="mt-1 font-semibold">{fixed.allocation}</div>
              </div>
            </div>
          </div>

          {tab === 'project' && (
            <div className="safu-section">
              <div className="text-sm font-semibold">Project info</div>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[var(--subtext)]">Project name</div>
                  <input className="field mt-2" placeholder="e.g. NEXA" />
                </div>
                <div>
                  <div className="text-xs text-[var(--subtext)]">Ticker</div>
                  <input className="field mt-2" placeholder="e.g. NXRA" />
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-[var(--subtext)]">Detailed overview</div>
                  <textarea className="field mt-2" rows={6} placeholder="Explain utility, roadmap, and liquidity strategy."></textarea>
                  <div className="mt-2 text-xs text-[var(--subtext)]">
                    Tip: in production, this can support rich text (Markdown/Editor) while storing a safe format.
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'founder' && (
            <div className="safu-section">
              <div className="text-sm font-semibold">Founder</div>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[var(--subtext)]">Founder name</div>
                  <input className="field mt-2" placeholder="Optional public name" />
                </div>
                <div>
                  <div className="text-xs text-[var(--subtext)]">Wallet</div>
                  <input className="field mt-2" placeholder="0x…" />
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-[var(--subtext)]">Bio</div>
                  <textarea className="field mt-2" rows={4} placeholder="Short founder bio and credibility."></textarea>
                </div>
              </div>
            </div>
          )}

          {tab === 'links' && (
            <div className="safu-section">
              <div className="text-sm font-semibold">Links</div>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <input className="field" placeholder="Website" />
                <input className="field" placeholder="X (Twitter)" />
                <input className="field" placeholder="Telegram" />
                <input className="field" placeholder="Docs / Whitepaper" />
              </div>
            </div>
          )}

          {tab === 'team' && (
            <div className="safu-section">
              <div className="text-sm font-semibold">Team (up to 2)</div>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                  <div className="text-xs text-[var(--subtext)]">Member 1</div>
                  <input className="field mt-2" placeholder="Name" />
                  <input className="field mt-2" placeholder="Role" />
                  <input className="field mt-2" placeholder="X / LinkedIn" />
                </div>
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                  <div className="text-xs text-[var(--subtext)]">Member 2</div>
                  <input className="field mt-2" placeholder="Name" />
                  <input className="field mt-2" placeholder="Role" />
                  <input className="field mt-2" placeholder="X / LinkedIn" />
                </div>
              </div>
            </div>
          )}

          {tab === 'review' && (
            <div className="safu-section">
              <div className="text-sm font-semibold">Review & Submit</div>
              <div className="mt-3 text-sm text-[var(--subtext)]">
                Confirm details before submitting. After submit, the raise goes to admin review.
              </div>
              <button className="btn-primary mt-5">Submit application</button>
              <div className="mt-3 text-xs text-[var(--subtext)] text-center">
                By submitting, you agree to Raise Terms and the platform&apos;s review policy.
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: sticky tabs */}
        <aside className="lg:sticky lg:top-24 space-y-4">
          <div className="safu-section">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Application</div>
              <span className="pill">Draft</span>
            </div>

            <div className="mt-4 grid gap-2">
              <button className={'btn-ghost w-full text-left ' + (tab==='project'?'bg-[var(--text)] text-[var(--bg)]':'')} onClick={()=>setTab('project')} type="button">Project info</button>
              <button className={'btn-ghost w-full text-left ' + (tab==='founder'?'bg-[var(--text)] text-[var(--bg)]':'')} onClick={()=>setTab('founder')} type="button">Founder</button>
              <button className={'btn-ghost w-full text-left ' + (tab==='links'?'bg-[var(--text)] text-[var(--bg)]':'')} onClick={()=>setTab('links')} type="button">Links</button>
              <button className={'btn-ghost w-full text-left ' + (tab==='team'?'bg-[var(--text)] text-[var(--bg)]':'')} onClick={()=>setTab('team')} type="button">Team</button>
              <button className={'btn-ghost w-full text-left ' + (tab==='review'?'bg-[var(--text)] text-[var(--bg)]':'')} onClick={()=>setTab('review')} type="button">Review & submit</button>
            </div>
          </div>

          <div className="safu-section">
            <div className="text-sm font-semibold">Token icon</div>
            <div className="mt-3 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] flex items-center justify-center font-semibold">
                  {iconName ? iconName.slice(0,2).toUpperCase() : '⚡'}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-[var(--subtext)]">Upload (placeholder)</div>
                  <input className="field mt-2" value={iconName} onChange={(e)=>setIconName(e.target.value)} placeholder="Type icon label e.g. NX" />
                </div>
              </div>
              <div className="mt-3 text-xs text-[var(--subtext)]">
                In production, this becomes a file uploader with validation.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
