"use client";

import { useMemo, useState } from 'react'
import { ImageUploader } from '@/components/create/ImageUploader'
import { useSafuPadSDK } from '@/lib/safupad-sdk'
import { useRouter } from 'next/navigation'

type Tab = 'project' | 'founder' | 'links' | 'team' | 'review'

const TAB_ORDER: Tab[] = ['project', 'founder', 'links', 'team', 'review']

export default function ProjectRaiseApplicationPage() {
  const router = useRouter()
  const { sdk, isInitializing, error: sdkError } = useSafuPadSDK()

  const [tab, setTab] = useState<Tab>('project')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Form state - Project info
  const [projectName, setProjectName] = useState('')
  const [ticker, setTicker] = useState('')
  const [overview, setOverview] = useState('')

  // Form state - Founder
  const [founderName, setFounderName] = useState('')
  const [founderWallet, setFounderWallet] = useState('')
  const [founderBio, setFounderBio] = useState('')

  // Form state - Links
  const [website, setWebsite] = useState('')
  const [twitter, setTwitter] = useState('')
  const [telegram, setTelegram] = useState('')
  const [docs, setDocs] = useState('')

  // Form state - Team
  const [member1Name, setMember1Name] = useState('')
  const [member1Role, setMember1Role] = useState('')
  const [member1Social, setMember1Social] = useState('')
  const [member2Name, setMember2Name] = useState('')
  const [member2Role, setMember2Role] = useState('')
  const [member2Social, setMember2Social] = useState('')

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

  const fixed = useMemo(() => ({
    window: '72 hours',
    supply: '1,000,000,000',
    allocation: 'Fixed presets',
  }), [])

  const handleSubmit = async () => {
    if (!sdk) {
      setSubmitError('SDK not initialized. Please connect your wallet.')
      return
    }

    if (!projectName || !ticker) {
      setSubmitError('Please fill in project name and ticker.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // TODO: Upload image to IPFS and get logoURI
      const logoURI = '' // Placeholder - would be replaced with actual IPFS upload

      // Count team members
      let teamMemberCount = 0
      if (member1Name) teamMemberCount++
      if (member2Name) teamMemberCount++

      const result = await sdk.launchpad.createLaunch({
        name: projectName,
        symbol: ticker,
        totalSupply: 1_000_000_000, // Fixed 1B supply
        raiseTargetBNB: '10', // Default raise target
        raiseMaxBNB: '50', // Default max raise
        vestingDuration: 180 * 24 * 60 * 60, // 180 days in seconds (contract overrides anyway)
        metadata: {
          logoURI,
          description: overview,
          website,
          twitter,
          telegram,
          discord: '',
          docs,
        },
        burnLP: true,
        teamInfo: {
          founder: {
            name: founderName,
            walletAddress: founderWallet,
            bio: founderBio,
          },
          teamMember1: {
            name: member1Name,
            role: member1Role,
            twitter: member1Social,
            linkedin: '',
          },
          teamMember2: {
            name: member2Name,
            role: member2Role,
            twitter: member2Social,
            linkedin: '',
          },
          teamMemberCount,
        },
      })

      // Wait for transaction confirmation
      await result.wait()

      // Redirect to portfolio
      router.push('/portfolio')
    } catch (err: any) {
      console.error('Submit failed:', err)
      setSubmitError(err?.message || 'Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
                  <input
                    className="field mt-2"
                    placeholder="e.g. NEXA"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div>
                  <div className="text-xs text-[var(--subtext)]">Ticker</div>
                  <input
                    className="field mt-2"
                    placeholder="e.g. NXRA"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-[var(--subtext)]">Detailed overview</div>
                  <textarea
                    className="field mt-2"
                    rows={6}
                    placeholder="Explain utility, roadmap, and liquidity strategy."
                    value={overview}
                    onChange={(e) => setOverview(e.target.value)}
                  ></textarea>
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
                  <input
                    className="field mt-2"
                    placeholder="Optional public name"
                    value={founderName}
                    onChange={(e) => setFounderName(e.target.value)}
                  />
                </div>
                <div>
                  <div className="text-xs text-[var(--subtext)]">Wallet</div>
                  <input
                    className="field mt-2"
                    placeholder="0x…"
                    value={founderWallet}
                    onChange={(e) => setFounderWallet(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-[var(--subtext)]">Bio</div>
                  <textarea
                    className="field mt-2"
                    rows={4}
                    placeholder="Short founder bio and credibility."
                    value={founderBio}
                    onChange={(e) => setFounderBio(e.target.value)}
                  ></textarea>
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
                <input
                  className="field"
                  placeholder="Website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
                <input
                  className="field"
                  placeholder="X (Twitter)"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                />
                <input
                  className="field"
                  placeholder="Telegram"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                />
                <input
                  className="field"
                  placeholder="Docs / Whitepaper"
                  value={docs}
                  onChange={(e) => setDocs(e.target.value)}
                />
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
                  <input
                    className="field mt-2"
                    placeholder="Name"
                    value={member1Name}
                    onChange={(e) => setMember1Name(e.target.value)}
                  />
                  <input
                    className="field mt-2"
                    placeholder="Role"
                    value={member1Role}
                    onChange={(e) => setMember1Role(e.target.value)}
                  />
                  <input
                    className="field mt-2"
                    placeholder="X / LinkedIn"
                    value={member1Social}
                    onChange={(e) => setMember1Social(e.target.value)}
                  />
                </div>
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                  <div className="text-xs text-[var(--subtext)]">Member 2</div>
                  <input
                    className="field mt-2"
                    placeholder="Name"
                    value={member2Name}
                    onChange={(e) => setMember2Name(e.target.value)}
                  />
                  <input
                    className="field mt-2"
                    placeholder="Role"
                    value={member2Role}
                    onChange={(e) => setMember2Role(e.target.value)}
                  />
                  <input
                    className="field mt-2"
                    placeholder="X / LinkedIn"
                    value={member2Social}
                    onChange={(e) => setMember2Social(e.target.value)}
                  />
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

              {submitError && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {submitError}
                </div>
              )}

              {!!sdkError && (
                <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
                  SDK Error: Please connect your wallet to submit.
                </div>
              )}

              <div className="mt-6 flex justify-between items-center">
                <button type="button" onClick={goToPrevTab} className="btn-ghost">
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isInitializing || !sdk}
                >
                  {isSubmitting ? 'Submitting...' : isInitializing ? 'Initializing SDK...' : 'Submit application'}
                </button>
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
