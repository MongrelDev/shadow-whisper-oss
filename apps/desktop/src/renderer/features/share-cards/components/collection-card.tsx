import type { AchievementItem } from "@whisper/api";
import { CARD_BG, monoStyle, shareCardRoot } from "../utils/card-styles";
import { CardChrome, CardBackdropBars, CardUserRow } from "./card-chrome";
import {
  BADGE_META,
  BADGE_ORDER,
  getBadgeTitle,
  type BadgeKey,
} from "~/features/progress/achievements/lib/badges";

interface CollectionCardProps {
  userName: string;
  achievements: ReadonlyArray<AchievementItem>;
}

export function CollectionCard({ userName, achievements }: CollectionCardProps) {
  const earned = achievements.filter((a) => a.earnedAt !== null);
  const earnedKeys = new Set(earned.map((a) => a.key));
  const orderedEarned = BADGE_ORDER.filter((k) => earnedKeys.has(k)).map(
    (k) => earned.find((a) => a.key === k)!
  );
  const displayItems = orderedEarned.slice(0, 5);

  return (
    <div style={{ ...shareCardRoot, background: CARD_BG.ink }}>
      <CardBackdropBars />
      <CardChrome label="MINHAS CONQUISTAS" />

      <CardUserRow
        name={userName}
        subtitle={`${earned.length} de ${achievements.length} desbloqueadas`}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          position: "relative",
          marginTop: 4,
        }}
      >
        {displayItems.length === 0 && (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              color: "rgba(255,255,255,.5)",
            }}
          >
            Continue ditando para desbloquear conquistas
          </div>
        )}
        {displayItems.map((a) => (
          <AchievementRow key={a.key} achievement={a} />
        ))}
      </div>
    </div>
  );
}

function AchievementRow({ achievement }: { achievement: AchievementItem }) {
  const key = achievement.key as BadgeKey;
  const meta = BADGE_META[key];
  if (!meta) return null;
  const { Icon } = meta;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "7px 12px",
        borderRadius: 10,
        background: "rgba(255,255,255,.04)",
        border: "1px solid rgba(255,255,255,.06)",
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          flexShrink: 0,
          background: "rgba(136, 125, 207, 0.2)",
          border: "1px solid rgba(136, 125, 207, 0.35)",
          color: "#b8a9f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={14} aria-hidden />
      </span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{getBadgeTitle(key)}</span>
      <span
        style={{
          ...monoStyle,
          fontSize: 9.5,
          letterSpacing: ".12em",
          color: "#b8a9f0",
        }}
      >
        {achievement.earnedAt
          ? new Date(achievement.earnedAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            })
          : ""}
      </span>
    </div>
  );
}
