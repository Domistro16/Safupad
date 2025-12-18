"use client";

import type { CardData } from "@/data/cards";

interface SafuCardProps {
  card: CardData;
  pointerEvents?: boolean;
}

export default function SafuCard({ card, pointerEvents = true }: SafuCardProps) {
  return (
    <div
      className="safu-card"
      data-type={card.type}
      data-status={card.status}
      style={pointerEvents ? undefined : { pointerEvents: "none" }}
    >
      <div className="safu-card-header">
        <div className="safu-icon">{card.icon}</div>
        <div>
          <div className="safu-title">{card.title}</div>
          <div className="safu-sub">{card.sub}</div>
        </div>
      </div>

      <div className="safu-pills">
        {card.pills.map(([label, cls]) => (
          <span key={label} className={cls}>
            {label}
          </span>
        ))}
      </div>

      <p className="safu-desc">{card.desc}</p>

      <div className="safu-creator">
        <div className="safu-avatar">👤</div>
        <span>{card.creator}</span>
      </div>

      <div className="safu-stats">
        <div className="safu-row">
          <span>Raised</span>
          <span>{card.raised}</span>
        </div>
        <div className="safu-bar">
          <div style={{ width: `${card.progress}%` }} />
        </div>
        <div className="safu-substats">
          <span>{card.substats[0]}</span>
          <span>{card.substats[1]}</span>
        </div>
      </div>

      <div className="safu-footer">
        <span>View pool →</span>
        <button className="safu-btn">Details</button>
      </div>
    </div>
  );
}
