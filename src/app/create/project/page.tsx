"use client";

import { useMemo, useState } from 'react'
import { ImageUploader } from '@/components/create/ImageUploader'

type Tab = 'project' | 'founder' | 'links' | 'team' | 'review'

const TAB_ORDER: Tab[] = ['project', 'founder', 'links', 'team', 'review']

export default function ProjectRaiseApplicationPage() {
  const [tab, setTab] = useState<Tab>('project')

  const goToNextTab = () => {
    const currentIndex = TAB_ORDER.indexOf(tab)
    if (currentIndex < TAB_ORDER.length - 1) {
      setTab(TAB_ORDER[currentIndex + 1])
    }
  }

  const goToPrevTab = () => {
    const currentIndex = TAB_ORDER.indexOf(tab)
    if (currentIndex > 0) {
      setTab(TAB_ORDER[currentIndex - 1])
    }
  }
  const [imageFile, setImageFile] = useState<File | null>(null)
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
              <div className="mt-6 flex justify-end">
                <button type="button" onClick={goToNextTab} className="btn-primary">
                  Next: Founder
                </button>
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
              <div className="mt-6 flex justify-between">
                <button type="button" onClick={goToPrevTab} className="btn-ghost">
                  Back
                </button>
                <button type="button" onClick={goToNextTab} className="btn-primary">
                  Next: Links
                </button>
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
              <div className="mt-6 flex justify-between">
                <button type="button" onClick={goToPrevTab} className="btn-ghost">
                  Back
                </button>
                <button type="button" onClick={goToNextTab} className="btn-primary">
                  Next: Team
                </button>
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
              <div className="mt-6 flex justify-between">
                <button type="button" onClick={goToPrevTab} className="btn-ghost">
                  Back
                </button>
                <button type="button" onClick={goToNextTab} className="btn-primary">
                  Next: Review
                </button>
              </div>
            </div>
          )}

          {tab === 'review' && (
            <div className="safu-section">
              <div className="text-sm font-semibold">Review & Submit</div>
              <div className="mt-3 text-sm text-[var(--subtext)]">
                Confirm details before submitting. After submit, the raise goes to admin review.
              </div>
              <div className="mt-6 flex justify-between items-center">
                <button type="button" onClick={goToPrevTab} className="btn-ghost">
                  Back
                </button>
                <button className="btn-primary">Submit application</button>
              </div>
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
              <button className={'btn-ghost w-full text-left ' + (tab === 'project' ? 'bg-[var(--text)] text-[var(--bg)]' : '')} onClick={() => setTab('project')} type="button">Project info</button>
              <button className={'btn-ghost w-full text-left ' + (tab === 'founder' ? 'bg-[var(--text)] text-[var(--bg)]' : '')} onClick={() => setTab('founder')} type="button">Founder</button>
              <button className={'btn-ghost w-full text-left ' + (tab === 'links' ? 'bg-[var(--text)] text-[var(--bg)]' : '')} onClick={() => setTab('links')} type="button">Links</button>
              <button className={'btn-ghost w-full text-left ' + (tab === 'team' ? 'bg-[var(--text)] text-[var(--bg)]' : '')} onClick={() => setTab('team')} type="button">Team</button>
              <button className={'btn-ghost w-full text-left ' + (tab === 'review' ? 'bg-[var(--text)] text-[var(--bg)]' : '')} onClick={() => setTab('review')} type="button">Review & submit</button>
            </div>
          </div>

          <ImageUploader
            onFileChange={(file) => setImageFile(file)}
          />
        </aside>
      </div>
    </section>
  )
}
