"use client";

import { useMemo, useState } from 'react'

type Tab = 'token' | 'creator' | 'links' | 'review'

export default function InstantLaunchCreationPage() {
  const [tab, setTab] = useState<Tab>('token')
  const [iconName, setIconName] = useState('')

  const fixed = useMemo(() => ({
    cap: '50 BNB',
    supply: '1,000,000,000',
    tradingFee: '2%',
  }), [])

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
      <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
        <div className="space-y-6">
          <div className="safu-section">
            <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Create</div>
            <h1 className="text-2xl font-semibold mt-1">Instant Launch</h1>
            <div className="text-sm text-[var(--subtext)] mt-2">Launch your token instantly with bonding curve mechanics. No raise window needed.</div>

            <div className="mt-4 grid sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                <div className="text-xs text-[var(--subtext)]">Bonding cap</div>
                <div className="mt-1 font-semibold">{fixed.cap}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                <div className="text-xs text-[var(--subtext)]">Token supply</div>
                <div className="mt-1 font-semibold">{fixed.supply}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                <div className="text-xs text-[var(--subtext)]">Trading fee</div>
                <div className="mt-1 font-semibold">{fixed.tradingFee}</div>
              </div>
            </div>
          </div>

          {tab === 'token' && (
            <div className="safu-section">
              <div className="text-sm font-semibold">Token info</div>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[var(--subtext)]">Token name</div>
                  <input className="field mt-2" placeholder="e.g. NEXA" />
                </div>
                <div>
                  <div className="text-xs text-[var(--subtext)]">Ticker</div>
                  <input className="field mt-2" placeholder="e.g. NXRA" />
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-[var(--subtext)]">Description</div>
                  <textarea className="field mt-2" rows={4} placeholder="Describe your token, its utility, and community focus."></textarea>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm font-semibold mb-3">Fee structure (fixed)</div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--subtext)]">Creator</span>
                      <span className="font-medium">1%</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--subtext)]">InfoFi</span>
                      <span className="font-medium">0.6%</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--subtext)]">EduFi</span>
                      <span className="font-medium">0.3%</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--subtext)]">Platform</span>
                      <span className="font-medium">0.1%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'creator' && (
            <div className="safu-section">
              <div className="text-sm font-semibold">Creator info</div>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[var(--subtext)]">Display name (optional)</div>
                  <input className="field mt-2" placeholder="e.g. nexa.safu" />
                </div>
                <div>
                  <div className="text-xs text-[var(--subtext)]">Wallet</div>
                  <input className="field mt-2" placeholder="0x…" />
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-[var(--subtext)]">Bio (optional)</div>
                  <textarea className="field mt-2" rows={3} placeholder="A brief intro about yourself or your project."></textarea>
                </div>
              </div>
            </div>
          )}

          {tab === 'links' && (
            <div className="safu-section">
              <div className="text-sm font-semibold">Social links</div>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <input className="field" placeholder="Website (optional)" />
                <input className="field" placeholder="X / Twitter (optional)" />
                <input className="field" placeholder="Telegram (optional)" />
                <input className="field" placeholder="Discord (optional)" />
              </div>
              <div className="mt-3 text-xs text-[var(--subtext)]">
                Links will be displayed on your token page. All fields are optional.
              </div>
            </div>
          )}

          {tab === 'review' && (
            <div className="safu-section">
              <div className="text-sm font-semibold">Review & Launch</div>
              <div className="mt-3 text-sm text-[var(--subtext)]">
                Your token will be deployed instantly. Trading starts immediately after deployment.
              </div>

              <div className="mt-5 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-5">
                <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold mb-4">Launch summary</div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--subtext)]">Launch type</span>
                    <span className="font-medium">Instant</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--subtext)]">Bonding cap</span>
                    <span className="font-medium">50 BNB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--subtext)]">Graduation</span>
                    <span className="font-medium">Auto to PancakeSwap</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--subtext)]">Creator fee claim</span>
                    <span className="font-medium">24h cooldown</span>
                  </div>
                </div>
              </div>

              <button className="btn-primary mt-5">Launch Token</button>
              <div className="mt-3 text-xs text-[var(--subtext)] text-center">
                By launching, you agree to SafuPad&apos;s terms of service and instant launch mechanics.
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: sticky tabs */}
        <aside className="lg:sticky lg:top-24 space-y-4">
          <div className="safu-section">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Instant Launch</div>
              <span className="pill">New</span>
            </div>

            <div className="mt-4 grid gap-2">
              <button className={'btn-ghost w-full text-left ' + (tab==='token'?'bg-[var(--text)] text-[var(--bg)]':'')} onClick={()=>setTab('token')} type="button">Token info</button>
              <button className={'btn-ghost w-full text-left ' + (tab==='creator'?'bg-[var(--text)] text-[var(--bg)]':'')} onClick={()=>setTab('creator')} type="button">Creator</button>
              <button className={'btn-ghost w-full text-left ' + (tab==='links'?'bg-[var(--text)] text-[var(--bg)]':'')} onClick={()=>setTab('links')} type="button">Links</button>
              <button className={'btn-ghost w-full text-left ' + (tab==='review'?'bg-[var(--text)] text-[var(--bg)]':'')} onClick={()=>setTab('review')} type="button">Review & launch</button>
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

          <div className="safu-section">
            <div className="text-sm font-semibold">Quick info</div>
            <div className="mt-3 space-y-2 text-xs text-[var(--subtext)]">
              <p>• Tokens launch instantly with bonding curve</p>
              <p>• Trading starts immediately after deployment</p>
              <p>• Graduate to PancakeSwap at 50 BNB cap</p>
              <p>• Claim creator fees every 24 hours</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
