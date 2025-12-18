"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function MobileSticky() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hideTimer: NodeJS.Timeout | null = null;

    function handleScroll() {
      const isMobile = window.innerWidth < 768;
      if (!isMobile) return;

      setVisible(true);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setVisible(false), 2000);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div
      id="mobileSticky"
      className="fixed bottom-6 left-0 right-0 mx-auto w-fit flex justify-center md:hidden gap-4 z-50 transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
      }}
    >
      <Link
        href="/create"
        className="px-5 py-3 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] text-sm font-semibold shadow-md flex items-center gap-2"
      >
        <span className="text-[15px]">📦</span> Project
      </Link>
      <Link
        href="/create"
        className="px-5 py-3 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] text-sm font-semibold shadow-md flex items-center gap-2"
      >
        <span className="text-[15px]">⚡</span> Instant
      </Link>
    </div>
  );
}
