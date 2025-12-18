"use client";

import { useState } from "react";
import { Navbar, Hero, FilterBar, CardGrid, MobileSticky } from "@/components/home";
import { cards } from "@/data/cards";

export default function Home() {
  const [filter, setFilter] = useState<"all" | "project" | "instant" | "live">("all");

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <FilterBar activeFilter={filter} onFilterChange={setFilter} />
      <CardGrid cards={cards} filter={filter} />
      <MobileSticky />
    </div>
  );
}
