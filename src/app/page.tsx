"use client";

import { useState, useEffect, useRef, useCallback } from 'react'
import { Navbar, FilterBar, CardGrid, MobileSticky } from "@/components/home";
import { Hero } from "@/components/home/Hero";

import { useSafuPadSDK } from "@/lib/safupad-sdk";
import { fetchAllTokens, mapTokenToCardData } from "@/lib/token-utils";
import type { CardData } from "@/data/cards";

export default function Home() {
  const [filter, setFilter] = useState<"all" | "project" | "instant" | "live">("all");
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);

  const { sdk, connect } = useSafuPadSDK();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!sdk) {
        setCards([]); // No SDK = no cards (removed static fallback)
        setLoading(false);
        return;
      }

      try {
        console.log("📦 Homepage: Fetching tokens from contracts...");
        const tokens = await fetchAllTokens(sdk);
        console.log(`📦 Homepage: Fetched ${tokens.length} tokens from contracts`);
        if (cancelled) return;

        const mapped = tokens.map(mapTokenToCardData);
        console.log(`📦 Homepage: Displaying ${mapped.length} tokens`);
        setCards(mapped);
      } catch (e) {
        console.error("📦 Homepage: Error fetching tokens:", e);
        setCards([]); // On error, show no cards (removed static fallback)
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // If SDK is initializing, wait. 
    // Actually useSafuPadSDK initializes internally. 
    load();
    return () => { cancelled = true; }
  }, [sdk]);

  const heroRef = useRef<HTMLElement>(null)
  const { showDesktopSticky, showMobileSticky } = useStickyButtons(heroRef)

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero ref={heroRef} cards={cards} />
      <FilterBar activeFilter={filter} onFilterChange={(f) => setFilter(f)} showDesktopSticky={showDesktopSticky} />
      <CardGrid cards={cards} filter={filter} />
      <MobileSticky visible={showMobileSticky} />
    </div>
  );
}



export function useStickyButtons(heroRef: React.RefObject<HTMLElement | null>) {
  const [showDesktopSticky, setShowDesktopSticky] = useState(false)
  const [showMobileSticky, setShowMobileSticky] = useState(false)
  const mobileHideTimerRef = useRef(null)

  const handleScroll = useCallback(() => {
    if (!heroRef.current) return

    const rect = heroRef.current.getBoundingClientRect()
    const heroOut = rect.bottom < 80
    const isDesktop = window.innerWidth >= 768
    const isMobile = window.innerWidth < 768

    if (isDesktop) {
      setShowDesktopSticky(heroOut)
    }

    if (isMobile) {
      setShowMobileSticky(true)

      if (mobileHideTimerRef.current) {
        clearTimeout(mobileHideTimerRef.current)
      }

      mobileHideTimerRef.current = setTimeout(() => {
        setShowMobileSticky(false)
      }, 2000)
    }
  }, [heroRef])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (mobileHideTimerRef.current) {
        clearTimeout(mobileHideTimerRef.current)
      }
    }
  }, [handleScroll])

  return { showDesktopSticky, showMobileSticky }
}

