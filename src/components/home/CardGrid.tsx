"use client";

import SafuCard from "./SafuCard";
import type { CardData } from "@/data/cards";

interface CardGridProps {
  cards: CardData[];
  filter: "all" | "project" | "instant" | "live";
}

export default function CardGrid({ cards, filter }: CardGridProps) {
  const filteredCards = cards.filter((card) => {
    if (filter === "all") return true;
    if (filter === "project") return card.type === "project";
    if (filter === "instant") return card.type === "instant";
    if (filter === "live") return card.status === "live";
    return true;
  });

  return (
    <main className="max-w-6xl mx-auto px-6 lg:px-10 pb-24">
      <div
        id="cardGrid"
        className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6"
      >
        {filteredCards.map((card) => (
          <SafuCard key={card.id} card={card} />
        ))}
      </div>
      {filteredCards.length === 0 && (
        <div className="text-center py-12 text-[var(--subtext)]">
          No launches found for this filter.
        </div>
      )}
    </main>
  );
}
