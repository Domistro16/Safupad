"use client";

import { useMemo, useState } from 'react'
import { ImageUploader } from '@/components/create/ImageUploader'

type Tab = 'project' | 'founder' | 'links' | 'team' | 'review'

const TAB_ORDER: Tab[] = ['project', 'founder', 'links', 'team', 'review']

interface TeamMember {
  name: string
  role: string
  twitter: string
  linkedin: string
}

interface FormData {
  // Project info
  projectName: string
  ticker: string
  overview: string
  // Founder info
  founder: {
    name: string
    walletAddress: string
    bio: string
  }
  // Links
  links: {
    website: string
    twitter: string
    telegram: string
    docs: string
  }
  // Team members
  teamMember1: TeamMember
  teamMember2: TeamMember
}

const initialFormData: FormData = {
  projectName: '',
  ticker: '',
  overview: '',
  founder: {
    name: '',
    walletAddress: '',
    bio: ''
  },
  links: {
    website: '',
    twitter: '',
    telegram: '',
    docs: ''
  },
  teamMember1: {
    name: '',
    role: '',
    twitter: '',
    linkedin: ''
  },
  teamMember2: {
    name: '',
    role: '',
    twitter: '',
    linkedin: ''
  }
}

export default function ProjectRaiseApplicationPage() {
  const [tab, setTab] = useState<Tab>('project')
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [imageFile, setImageFile] = useState<File | null>(null)

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

  // Calculate team member count based on filled data
  const getTeamMemberCount = () => {
    let count = 0
    if (formData.teamMember1.name) count++
    if (formData.teamMember2.name) count++
    return count
  }

  // Build teamInfo object for SDK
  const buildTeamInfo = () => {
    const teamMemberCount = getTeamMemberCount()

    const teamInfo: Record<string, unknown> = {
      founder: {
        name: formData.founder.name,
        walletAddress: formData.founder.walletAddress,
        bio: formData.founder.bio
      },
      teamMemberCount
    }

    if (formData.teamMember1.name) {
      teamInfo.teamMember1 = {
        name: formData.teamMember1.name,
        role: formData.teamMember1.role,
        twitter: formData.teamMember1.twitter,
        linkedin: formData.teamMember1.linkedin
      }
    }

    if (formData.teamMember2.name) {
      teamInfo.teamMember2 = {
        name: formData.teamMember2.name,
        role: formData.teamMember2.role,
        twitter: formData.teamMember2.twitter,
        linkedin: formData.teamMember2.linkedin
      }
    }

    return teamInfo
  }

  const handleSubmit = () => {
    const teamInfo = buildTeamInfo()
    console.log('Form Data:', formData)
    console.log('Team Info for SDK:', teamInfo)
    // TODO: Call SDK with teamInfo
    // await sdk.launchpad.createLaunch(
    //   formData.projectName,
    //   formData.ticker,
    //   1000000000,
    //   softCap,
    //   hardCap,
    //   vestingDuration,
    //   tokenMetadata,
    //   false,
    //   teamInfo
    // );
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
                    value={formData.projectName}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                  />
                </div>
                <div>
                  <div className="text-xs text-[var(--subtext)]">Ticker</div>
                  <input
                    className="field mt-2"
                    placeholder="e.g. NXRA"
                    value={formData.ticker}
                    onChange={(e) => setFormData(prev => ({ ...prev, ticker: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-[var(--subtext)]">Detailed overview</div>
                  <textarea
                    className="field mt-2"
                    rows={6}
                    placeholder="Explain utility, roadmap, and liquidity strategy."
                    value={formData.overview}
                    onChange={(e) => setFormData(prev => ({ ...prev, overview: e.target.value }))}
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
                    value={formData.founder.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      founder: { ...prev.founder, name: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <div className="text-xs text-[var(--subtext)]">Wallet address</div>
                  <input
                    className="field mt-2"
                    placeholder="0x…"
                    value={formData.founder.walletAddress}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      founder: { ...prev.founder, walletAddress: e.target.value }
                    }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-[var(--subtext)]">Bio</div>
                  <textarea
                    className="field mt-2"
                    rows={4}
                    placeholder="Short founder bio and credibility."
                    value={formData.founder.bio}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      founder: { ...prev.founder, bio: e.target.value }
                    }))}
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
                  value={formData.links.website}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    links: { ...prev.links, website: e.target.value }
                  }))}
                />
                <input
                  className="field"
                  placeholder="X (Twitter)"
                  value={formData.links.twitter}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    links: { ...prev.links, twitter: e.target.value }
                  }))}
                />
                <input
                  className="field"
                  placeholder="Telegram"
                  value={formData.links.telegram}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    links: { ...prev.links, telegram: e.target.value }
                  }))}
                />
                <input
                  className="field"
                  placeholder="Docs / Whitepaper"
                  value={formData.links.docs}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    links: { ...prev.links, docs: e.target.value }
                  }))}
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
                    value={formData.teamMember1.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      teamMember1: { ...prev.teamMember1, name: e.target.value }
                    }))}
                  />
                  <input
                    className="field mt-2"
                    placeholder="Role"
                    value={formData.teamMember1.role}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      teamMember1: { ...prev.teamMember1, role: e.target.value }
                    }))}
                  />
                  <input
                    className="field mt-2"
                    placeholder="Twitter username"
                    value={formData.teamMember1.twitter}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      teamMember1: { ...prev.teamMember1, twitter: e.target.value }
                    }))}
                  />
                  <input
                    className="field mt-2"
                    placeholder="LinkedIn username"
                    value={formData.teamMember1.linkedin}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      teamMember1: { ...prev.teamMember1, linkedin: e.target.value }
                    }))}
                  />
                </div>
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                  <div className="text-xs text-[var(--subtext)]">Member 2</div>
                  <input
                    className="field mt-2"
                    placeholder="Name"
                    value={formData.teamMember2.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      teamMember2: { ...prev.teamMember2, name: e.target.value }
                    }))}
                  />
                  <input
                    className="field mt-2"
                    placeholder="Role"
                    value={formData.teamMember2.role}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      teamMember2: { ...prev.teamMember2, role: e.target.value }
                    }))}
                  />
                  <input
                    className="field mt-2"
                    placeholder="Twitter username"
                    value={formData.teamMember2.twitter}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      teamMember2: { ...prev.teamMember2, twitter: e.target.value }
                    }))}
                  />
                  <input
                    className="field mt-2"
                    placeholder="LinkedIn username"
                    value={formData.teamMember2.linkedin}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      teamMember2: { ...prev.teamMember2, linkedin: e.target.value }
                    }))}
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

              {/* Review Summary */}
              <div className="mt-6 space-y-4">
                {/* Project Info */}
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                  <div className="text-xs text-[var(--accent-safu)] font-semibold uppercase tracking-wider">Project Info</div>
                  <div className="mt-2 grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--subtext)]">Name:</span>
                      <span className="font-medium">{formData.projectName || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--subtext)]">Ticker:</span>
                      <span className="font-medium">{formData.ticker || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Founder Info */}
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                  <div className="text-xs text-[var(--accent-safu)] font-semibold uppercase tracking-wider">Founder</div>
                  <div className="mt-2 grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--subtext)]">Name:</span>
                      <span className="font-medium">{formData.founder.name || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--subtext)]">Wallet:</span>
                      <span className="font-medium font-mono text-xs">{formData.founder.walletAddress ? `${formData.founder.walletAddress.slice(0, 6)}...${formData.founder.walletAddress.slice(-4)}` : '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Team Info */}
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                  <div className="text-xs text-[var(--accent-safu)] font-semibold uppercase tracking-wider">Team ({getTeamMemberCount()} members)</div>
                  <div className="mt-2 grid gap-3 text-sm">
                    {formData.teamMember1.name && (
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--subtext)]">{formData.teamMember1.name}</span>
                        <span className="font-medium">{formData.teamMember1.role || 'No role'}</span>
                      </div>
                    )}
                    {formData.teamMember2.name && (
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--subtext)]">{formData.teamMember2.name}</span>
                        <span className="font-medium">{formData.teamMember2.role || 'No role'}</span>
                      </div>
                    )}
                    {!formData.teamMember1.name && !formData.teamMember2.name && (
                      <div className="text-[var(--subtext)]">No team members added</div>
                    )}
                  </div>
                </div>

                {/* Links */}
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                  <div className="text-xs text-[var(--accent-safu)] font-semibold uppercase tracking-wider">Links</div>
                  <div className="mt-2 grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--subtext)]">Website:</span>
                      <span className="font-medium">{formData.links.website || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--subtext)]">Twitter:</span>
                      <span className="font-medium">{formData.links.twitter || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--subtext)]">Telegram:</span>
                      <span className="font-medium">{formData.links.telegram || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <button type="button" onClick={goToPrevTab} className="btn-ghost">
                  Back
                </button>
                <button type="button" onClick={handleSubmit} className="btn-primary">Submit application</button>
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
