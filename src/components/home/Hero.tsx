"use client";

import Link from "next/link";
import SafuCard from "./SafuCard";
import { cards, heroStack } from "@/data/cards";

const byId = Object.fromEntries(cards.map((c) => [c.id, c]));

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden bg-gradient-to-br from-[var(--surface-soft)] via-[var(--surface)] to-[var(--surface-soft)] py-10 px-6 lg:px-10"
    >
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6 items-center justify-items-center text-center lg:text-left relative z-10">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[var(--surface)]/60 backdrop-blur border border-[var(--border-soft)] text-[11px] tracking-[0.18em] uppercase text-[var(--subtext)]">
            <span>BNB Chain</span>
            <span className="w-1 h-1 rounded-full bg-[var(--text)]"></span>
            <span>Token Launch Layer</span>
          </div>

          <h1 className="text-[30px] sm:text-[40px] lg:text-[50px] font-bold leading-[1.05] tracking-[-0.06em]">
            Launch tokens that <br />
            <span className="bg-clip-text text-transparent bg-[linear-gradient(120deg,#f97316,#facc15,#fbbf24)]">
              actually respect your community.
            </span>
          </h1>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
            <Link
              href="/create"
              className="hero-btn-primary px-7 sm:px-8 py-3 rounded-full bg-[var(--text)] text-[var(--bg)] text-xs sm:text-sm font-semibold shadow-xl hover:opacity-90 transition"
            >
              Project raise
            </Link>
            <Link
              href="/create"
              className="px-7 sm:px-8 py-3 rounded-full bg-[var(--surface)] border border-[var(--border-soft)] text-xs sm:text-sm font-semibold flex items-center gap-2 text-[var(--text)] hover:bg-[var(--surface-soft)] transition"
            >
              <span className="w-6 h-6 rounded-full bg-[var(--bg)] text-[var(--text)] border border-white/60 flex items-center justify-center text-[10px]">
                ⚡
              </span>
              Instant launch
            </Link>
          </div>

          <p className="text-[var(--subtext)] text-xs sm:text-sm max-w-xl leading-relaxed">
            Empowering creators on BNB Chain. Powered by .safu.
          </p>
        </div>

        <div className="relative w-full max-w-sm mx-auto h-[520px] flex items-center justify-center select-none">
          {heroStack.map(({ id, wrapClass, cardId }) => (
            <div key={id} className={wrapClass}>
              <SafuCard card={byId[cardId]} pointerEvents={false} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
