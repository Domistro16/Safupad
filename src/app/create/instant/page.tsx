"use client";

import { useMemo, useState } from 'react'
import { ImageUploader } from '@/components/create/ImageUploader'
import { useSafuPadSDK } from '@/lib/safupad-sdk'
import { useRouter } from 'next/navigation'

type Tab = 'token' | 'creator' | 'links' | 'review'

export default function InstantLaunchCreationPage() {
  const router = useRouter()
  const { sdk, isInitializing, error: sdkError } = useSafuPadSDK()

  const [tab, setTab] = useState<Tab>('token')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Form state
  const [tokenName, setTokenName] = useState('')
  const [ticker, setTicker] = useState('')
  const [description, setDescription] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [creatorWallet, setCreatorWallet] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [twitter, setTwitter] = useState('')
  const [telegram, setTelegram] = useState('')
  const [discord, setDiscord] = useState('')
  const [initialBuyBNB, setInitialBuyBNB] = useState('0.1')

  const fixed = useMemo(() => ({
    cap: '50 BNB',
    supply: '1,000,000,000',
    tradingFee: '2%',
  }), [])

  const handleLaunch = async () => {
    if (!sdk) {
      setSubmitError('SDK not initialized. Please connect your wallet.')
      return
    }

    if (!tokenName || !ticker) {
      setSubmitError('Please fill in token name and ticker.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // TODO: Upload image to IPFS and get logoURI
      const logoURI = '' // Placeholder - would be replaced with actual IPFS upload

      const result = await sdk.launchpad.createInstantLaunch({
        name: tokenName,
        symbol: ticker,
        totalSupply: 1_000_000_000, // Fixed 1B supply
        metadata: {
          logoURI,
          description,
          website,
          twitter,
          telegram,
          discord,
          docs: '',
        },
        initialBuyBNB,
        burnLP: true,
      })

      // Wait for transaction confirmation
      await result.wait()

      // Redirect to the token page (would need to extract token address from events)
      router.push('/portfolio')
    } catch (err: any) {
      console.error('Launch failed:', err)
      setSubmitError(err?.message || 'Failed to launch token. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
                  <input
                    className="field mt-2"
                    placeholder="e.g. NEXA"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
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
                  <div className="text-xs text-[var(--subtext)]">Description</div>
                  <textarea
                    className="field mt-2"
                    rows={4}
                    placeholder="Describe your token, its utility, and community focus."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
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

              <div className="mt-6 flex justify-end">
                <button type="button" onClick={() => setTab('creator')} className="btn-primary">
                  Next: Creator
                </button>
              </div>
            </div>
          )}

          {tab === 'creator' && (
            <div className="safu-section">
              <div className="text-sm font-semibold">Creator info</div>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[var(--subtext)]">Display name (optional)</div>
                  <input
                    className="field mt-2"
                    placeholder="e.g. nexa.safu"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div>
                  <div className="text-xs text-[var(--subtext)]">Wallet</div>
                  <input
                    className="field mt-2"
                    placeholder="0x…"
                    value={creatorWallet}
                    onChange={(e) => setCreatorWallet(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-[var(--subtext)]">Bio (optional)</div>
                  <textarea
                    className="field mt-2"
                    rows={3}
                    placeholder="A brief intro about yourself or your project."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button type="button" onClick={() => setTab('token')} className="btn-ghost">
                  Back
                </button>
                <button type="button" onClick={() => setTab('links')} className="btn-primary">
                  Next: Links
                </button>
              </div>
            </div>
          )}

          {tab === 'links' && (
            <div className="safu-section">
              <div className="text-sm font-semibold">Social links</div>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <input
                  className="field"
                  placeholder="Website (optional)"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
                <input
                  className="field"
                  placeholder="X / Twitter (optional)"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                />
                <input
                  className="field"
                  placeholder="Telegram (optional)"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                />
                <input
                  className="field"
                  placeholder="Discord (optional)"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                />
              </div>
              <div className="mt-3 text-xs text-[var(--subtext)]">
                Links will be displayed on your token page. All fields are optional.
              </div>

              <div className="mt-6 flex justify-between">
                <button type="button" onClick={() => setTab('creator')} className="btn-ghost">
                  Back
                </button>
                <button type="button" onClick={() => setTab('review')} className="btn-primary">
                  Next: Review
                </button>
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
                    <span className="text-[var(--subtext)]">Token name</span>
                    <span className="font-medium">{tokenName || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--subtext)]">Ticker</span>
                    <span className="font-medium">{ticker || '—'}</span>
                  </div>
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

              <div className="mt-5">
                <div className="text-xs text-[var(--subtext)] mb-2">Initial buy (BNB)</div>
                <input
                  className="field"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.1"
                  value={initialBuyBNB}
                  onChange={(e) => setInitialBuyBNB(e.target.value)}
                />
                <div className="mt-1 text-xs text-[var(--subtext)]">
                  Amount of BNB to spend on initial token purchase (optional, set to 0 to skip).
                </div>
              </div>

              {submitError && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {submitError}
                </div>
              )}

              {sdkError!! && (
                <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
                  SDK Error: Please connect your wallet to launch.
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <button type="button" onClick={() => setTab('links')} className="btn-ghost">
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={handleLaunch}
                  disabled={isSubmitting || isInitializing || !sdk}
                >
                  {isSubmitting ? 'Launching...' : isInitializing ? 'Initializing SDK...' : 'Launch Token'}
                </button>
              </div>
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
              <button className={'btn-ghost w-full text-left ' + (tab === 'token' ? 'bg-[var(--text)] text-[var(--bg)]' : '')} onClick={() => setTab('token')} type="button">Token info</button>
              <button className={'btn-ghost w-full text-left ' + (tab === 'creator' ? 'bg-[var(--text)] text-[var(--bg)]' : '')} onClick={() => setTab('creator')} type="button">Creator</button>
              <button className={'btn-ghost w-full text-left ' + (tab === 'links' ? 'bg-[var(--text)] text-[var(--bg)]' : '')} onClick={() => setTab('links')} type="button">Links</button>
              <button className={'btn-ghost w-full text-left ' + (tab === 'review' ? 'bg-[var(--text)] text-[var(--bg)]' : '')} onClick={() => setTab('review')} type="button">Review & launch</button>
            </div>
          </div>

          <ImageUploader
            onFileChange={(file) => setImageFile(file)}
          />

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
