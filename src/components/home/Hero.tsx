import { forwardRef } from 'react'
import { SafuCard } from './SafuCard'

import type { CardData } from '@/data/cards'

interface HeroProps {
  cards?: CardData[]
}

export const Hero = forwardRef<HTMLElement, HeroProps>(function Hero({ cards }, ref) {
  const defaultCards = [
    {
      icon: '🥚',
      title: 'YieldNest',
      subtitle: 'Project raise · Closed',
      type: 'project',
      status: 'closed',
      description: 'A yield-aligned vault that tokenizes returns for community-powered growth.',
      creator: 'yieldnest.safu',
      raised: 500,
      total: 500,
      contributors: '412 contributors',
      endInfo: 'Graduated',
    },
    {
      icon: '📈',
      title: 'CurveCast',
      subtitle: 'Instant · Live',
      type: 'instant',
      status: 'live',
      description: 'Predictive bonding curve infrastructure powering creator-aligned tokens.',
      creator: '0x91f…2be3',
      raised: 12.1,
      total: 18,
      contributors: '64 buyers',
      endInfo: 'Bonding curve',
    },
    {
      icon: '🧿',
      title: 'PrimeVerse',
      subtitle: 'Project raise · Filling',
      type: 'project',
      status: 'live',
      description: 'A modular on-chain toolkit enabling communities to build and govern.',
      creator: '0xa54…ac12',
      raised: 320,
      total: 400,
      contributors: '216 contributors',
      endInfo: 'Ends in 7h 41m',
    },
  ] as const

  const heroCards = (cards && cards.length >= 3) ? [cards[2], cards[1], cards[0]] : defaultCards


  return (
    <section
      ref={ref}
      id="hero"
      className="relative w-full overflow-hidden bg-gradient-to-br from-[var(--surface-soft)] via-[var(--surface)] to-[var(--surface-soft)] py-10 px-6 lg:px-10"
    >
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6 items-center justify-items-center text-center lg:text-left relative z-10">
        {/* Left Content */}
        <div className="space-y-6">
          <div className="hero-chip inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[var(--surface)]/60 backdrop-blur border border-[var(--border-soft)] text-[11px] tracking-[0.18em] uppercase text-[var(--subtext)]">
            <span>BNB Chain</span>
            <span className="w-1 h-1 rounded-full bg-[var(--text)]" />
            <span>Token Launch Layer</span>
          </div>

          <h1 className="text-[30px] sm:text-[40px] lg:text-[50px] font-bold leading-[1.05] tracking-[-0.06em]">
            Launch tokens that <br />
            <span className="bg-clip-text text-transparent bg-[linear-gradient(120deg,#f97316,#facc15,#fbbf24)]">
              actually respect your community.
            </span>
          </h1>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4">
            <button className="hero-btn-primary px-7 sm:px-8 py-3 rounded-full bg-[var(--text)] text-[var(--bg)] text-xs sm:text-sm font-semibold shadow-xl">
              Project raise
            </button>
            <button className="px-7 sm:px-8 py-3 rounded-full bg-[var(--surface)] border border-[var(--border-soft)] text-xs sm:text-sm font-semibold flex items-center gap-2 text-[var(--text)] hover:bg-[var(--surface-soft)] transition-colors">
              <span className="w-6 h-6 rounded-full bg-[var(--bg)] text-[var(--text)] border border-white/60 flex items-center justify-center text-[10px]">
                ⚡
              </span>
              Instant launch
            </button>
          </div>

          <p className="text-[var(--subtext)] text-xs sm:text-sm max-w-xl leading-relaxed">
            Empowering creators on BNB Chain. Powered by .safu.
          </p>
        </div>

        {/* Hero Card Stack */}
        <div className="relative w-full max-w-sm mx-auto h-[520px] flex items-center justify-center select-none">
          {/* Back card (YieldNest) */}
          <div className="absolute translate-y-16 -rotate-6 scale-[0.88] opacity-90">
            {cards && cards.length >= 3 ? (
              <SafuCard card={heroCards[0] as CardData} />
            ) : (
              <SafuCard {...(heroCards[0] as typeof defaultCards[number])} />
            )}
          </div>

          {/* Mid card (CurveCast) */}
          <div className="absolute -translate-y-16 rotate-3 scale-[0.92] opacity-95">
            {cards && cards.length >= 3 ? (
              <SafuCard card={heroCards[1] as CardData} />
            ) : (
              <SafuCard {...(heroCards[1] as typeof defaultCards[number])} />
            )}
          </div>

          {/* Front card (PrimeVerse) */}
          <div className="absolute z-10 translate-y-2">
            {cards && cards.length >= 3 ? (
              <SafuCard card={heroCards[2] as CardData} />
            ) : (
              <SafuCard {...(heroCards[2] as typeof defaultCards[number])} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
})
