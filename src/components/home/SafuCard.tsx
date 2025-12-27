import Link from "next/link";
import type { CardData } from "@/data/cards";

interface SafuCardProps {
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  type?: "project" | "instant";
  status?: "live" | "soon" | "closed" | "upcoming" | "ended";
  description?: string;
  creator?: string;
  raised?: number;
  total?: number;
  contributors?: string;
  endInfo?: string;
  className?: string;
  card?: CardData;
}

export function SafuCard({
  icon: propIcon,
  title: propTitle,
  subtitle: propSubtitle,
  type: propType,
  status: propStatus,
  description: propDescription,
  creator: propCreator,
  raised: propRaised,
  total: propTotal,
  contributors: propContributors,
  endInfo: propEndInfo,
  className = "",
  card,
}: SafuCardProps) {
  // Map card data if provided, otherwise use individual props
  const data = card
    ? {
      icon: card.icon,
      title: card.title,
      subtitle: card.sub,
      type: card.type,
      status:
        card.status === "upcoming"
          ? "soon"
          : card.status === "ended"
            ? "closed"
            : card.status,
      description: card.desc,
      creator: card.creator,
      raised: card.raised,
      total: 100, // Used as a base for progress if card.progress exists
      progress: card.progress,
      contributors: card.substats[0],
      endInfo: card.substats[1],
    }
    : {
      icon: propIcon,
      title: propTitle,
      subtitle: propSubtitle,
      type: propType,
      status: propStatus,
      description: propDescription,
      creator: propCreator,
      raised: propRaised ? `${propRaised} BNB` : "0 BNB",
      total: propTotal || 0,
      progress:
        propRaised && propTotal ? (propRaised / propTotal) * 100 : 0,
      contributors: propContributors,
      endInfo: propEndInfo,
    };

  const percentage = Math.round(data.progress || 0);

  const getStatusPill = () => {
    switch (data.status) {
      case "live":
        return <span className="pill-live">Live</span>;
      case "soon":
      case "upcoming":
        return <span className="pill-soon">Soon</span>;
      case "closed":
      case "ended":
        return <span className="pill-closed">Closed</span>;
      default:
        return null;
    }
  };

  const getTypePill = () => {
    return data.type === "project" ? (
      <span className="pill-project">Project</span>
    ) : (
      <span className="pill-instant">Instant</span>
    );
  };

  return (
    <Link
      href={`/token/${data.type}/${card?.id || ""}`}
      className={`safu-card block no-underline ${className}`}
      data-type={data.type}
      data-status={data.status}
    >
      <div className="safu-card-header">
        <div className="safu-icon">{data.icon}</div>
        <div>
          <div className="safu-title">{data.title}</div>
          <div className="safu-sub">{data.subtitle}</div>
        </div>
      </div>

      <div className="safu-pills">
        {getTypePill()}
        {getStatusPill()}
      </div>

      <p className="safu-desc">{data.description}</p>

      <div className="safu-creator">
        <div className="safu-avatar">👤</div>
        <span>{data.creator}</span>
      </div>

      <div className="safu-stats">
        <div className="safu-row">
          <span>Raised</span>
          <span>{data.raised}</span>
        </div>
        <div className="safu-bar">
          <div style={{ width: `${percentage}%` }} />
        </div>
        <div className="safu-substats">
          <span>{data.contributors}</span>
          <span>{data.endInfo}</span>
        </div>
      </div>

      <div className="safu-footer">
        <span>View pool →</span>
        <button className="safu-btn">Details</button>
      </div>
    </Link>
  );
}
