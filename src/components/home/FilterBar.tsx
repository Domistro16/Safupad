export type LaunchFilter = "all" | "project" | "instant" | "live";

interface FilterBarProps {
  activeFilter: LaunchFilter
  onFilterChange: (filter: LaunchFilter) => void
  showDesktopSticky: boolean
}

export function FilterBar({
  activeFilter,
  onFilterChange,
  showDesktopSticky,
}: FilterBarProps) {
  const filters = [
    { key: 'all', label: 'All types' },
    { key: 'project', label: 'Project' },
    { key: 'instant', label: 'Instant' },
    { key: 'live', label: 'Live now' },
  ]

  return (
    <section className="sticky top-[76px] z-30 -mt-4 pb-4 px-6 lg:px-10 bg-gradient-to-b from-[var(--bg)] via-[var(--bg)] to-transparent">
      <div className="max-w-6xl mx-auto rounded-3xl bg-[var(--surface)]/90 border border-[var(--border-soft)] shadow px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative backdrop-blur">
        {/* Left Content */}
        <div
          className="flex-1 min-w-0 transition-all duration-300"
          style={{
            paddingLeft: showDesktopSticky ? '20.5rem' : '0',
            transform: showDesktopSticky ? 'translateY(10%)' : 'none',
          }}
        >
          <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--accent)]">
            Launches
          </div>
          <div className="text-[13px] text-[var(--subtext)] truncate mt-0">
            Filter by type, status and discover your next Safu launch.
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 text-xs justify-end flex-nowrap overflow-x-auto whitespace-nowrap hide-scrollbar">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => onFilterChange(filter.key as LaunchFilter)}
              className={`filter-btn px-3 py-1.5 rounded-full border border-[var(--border-soft)] transition-colors ${activeFilter === filter.key
                ? 'active-filter'
                : 'bg-[var(--surface)] hover:bg-[var(--surface-soft)]'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Desktop Sticky Buttons */}
        <div
          className={`hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 gap-2 transition-all duration-300 ${showDesktopSticky ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
        >
          <button className="safu-sticky-btn-desktop">⚡ Project Raise</button>
          <button className="safu-sticky-btn-desktop">⚡ Instant Launch</button>
        </div>
      </div>
    </section>
  )
}
