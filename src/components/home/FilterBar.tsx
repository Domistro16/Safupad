"use client";

import { useState } from "react";
import Link from "next/link";

type FilterType = "all" | "project" | "instant" | "live";

interface FilterBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export default function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  const filters: { type: FilterType; label: string }[] = [
    { type: "all", label: "All types" },
    { type: "project", label: "Project" },
    { type: "instant", label: "Instant" },
    { type: "live", label: "Live now" },
  ];

  return (
    <section className="sticky top-[76px] z-30 -mt-4 pb-4 px-6 lg:px-10 bg-gradient-to-b from-[var(--bg)] via-[var(--bg)] to-transparent">
      <div className="max-w-6xl mx-auto rounded-3xl bg-[var(--surface)]/90 border border-[var(--border-soft)] shadow px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative backdrop-blur">
        <div className="flex-1 min-w-0 filter-block">
          <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--accent)]">
            Launches
          </div>
          <div className="text-[13px] text-[var(--subtext)] truncate filter-desc mt-0">
            Filter by type, status and discover your next Safu launch.
          </div>
        </div>

        <div className="flex gap-2 text-xs justify-end flex-nowrap overflow-x-auto whitespace-nowrap">
          {filters.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => onFilterChange(type)}
              className={`filter-btn px-3 py-1.5 rounded-full border border-[var(--border-soft)] transition ${activeFilter === type
                  ? "active-filter bg-[#111] text-[#fef3c7]"
                  : "bg-[var(--surface)]"
                }`}
              data-type={type}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div
          id="desktopSticky"
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 gap-2 opacity-0 pointer-events-none transition-all duration-300"
        >
          <Link href="/create" className="safu-sticky-btn-desktop">
            ⚡ Project Raise
          </Link>
          <Link href="/create" className="safu-sticky-btn-desktop">
            ⚡ Instant Launch
          </Link>
        </div>
      </div>
    </section>
  );
}
