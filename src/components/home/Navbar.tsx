"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CustomConnectButton } from "@/components/CustomConnectButton";

export default function Navbar() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [launchDropdownOpen, setLaunchDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("safu-theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const initial = (stored as "light" | "dark") || (prefersDark ? "dark" : "light");
    setTheme(initial);
    applyTheme(initial);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLaunchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function applyTheme(t: "light" | "dark") {
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("safu-theme", next);
    applyTheme(next);
  }

  return (
    <>
      <nav className="w-full px-6 lg:px-10 py-4 lg:py-5 bg-[var(--surface)] backdrop-blur border-b border-[var(--border-soft)] sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-[18px] lg:text-[20px] font-bold tracking-[-0.04em]">
          <span>✦ SafuPad</span>
          <span className="hidden sm:inline text-[11px] px-2 py-1 rounded-full bg-black text-white border border-white tracking-[0.16em] uppercase">
            Capital Market 2.0
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {/* Launch Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setLaunchDropdownOpen(!launchDropdownOpen)}
              className="text-[var(--subtext)] hover:text-[var(--text)] transition flex items-center gap-1"
            >
              Launch
              <svg
                className={`w-4 h-4 transition-transform ${launchDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {launchDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] backdrop-blur-xl shadow-xl overflow-hidden">
                <Link
                  href="/create/project"
                  onClick={() => setLaunchDropdownOpen(false)}
                  className="block px-4 py-3 text-[var(--text)] hover:bg-[var(--surface-soft)] transition border-b border-[var(--border-soft)]"
                >
                  <div className="font-semibold">🚀 Project Raise</div>
                  <div className="text-xs text-[var(--subtext)]">Fundraise with vesting</div>
                </Link>
                <Link
                  href="/create/instant"
                  onClick={() => setLaunchDropdownOpen(false)}
                  className="block px-4 py-3 text-[var(--text)] hover:bg-[var(--surface-soft)] transition"
                >
                  <div className="font-semibold">⚡ Instant Token</div>
                  <div className="text-xs text-[var(--subtext)]">Bonding curve launch</div>
                </Link>
              </div>
            )}
          </div>
          <Link href="/" className="text-[var(--subtext)] hover:text-[var(--text)] transition">
            Explore
          </Link>
          <Link href="/portfolio" className="text-[var(--subtext)] hover:text-[var(--text)] transition">
            Portfolio
          </Link>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-full bg-[var(--surface)] border border-[var(--border-soft)] text-xs font-semibold flex items-center gap-2 mr-2"
            type="button"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <CustomConnectButton />
        </div>

        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-10 h-10 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] text-sm font-semibold flex items-center justify-center backdrop-blur"
            type="button"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <CustomConnectButton />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open menu"
            className="w-10 h-10 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] text-sm font-semibold flex items-center justify-center backdrop-blur"
            type="button"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      <div
        className={`md:hidden fixed top-[72px] left-4 right-4 z-50 transition-all duration-300 ${mobileMenuOpen
          ? "opacity-100 translate-y-0"
          : "opacity-0 pointer-events-none translate-y-[-6px]"
          }`}
      >
        <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)]/92 backdrop-blur-xl shadow-2xl p-3">
          <div className="grid gap-2">
            <Link
              href="/create/project"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-left px-4 py-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] hover:bg-[var(--surface)] transition text-[var(--text)] font-semibold"
            >
              🚀 Project Raise
            </Link>
            <Link
              href="/create/instant"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-left px-4 py-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] hover:bg-[var(--surface)] transition text-[var(--text)] font-semibold"
            >
              ⚡ Instant Token
            </Link>
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-left px-4 py-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] hover:bg-[var(--surface)] transition text-[var(--text)] font-semibold"
            >
              Explore
            </Link>
            <Link
              href="/portfolio"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-left px-4 py-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] hover:bg-[var(--surface)] transition text-[var(--text)] font-semibold"
            >
              Portfolio
            </Link>
          </div>
          <div className="mt-3 flex items-center justify-between px-4 py-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)]">
            <div className="text-xs text-[var(--subtext)]">Quick access</div>
            <div className="text-xs font-semibold text-[var(--accent)]">SafuPad</div>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/20"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
