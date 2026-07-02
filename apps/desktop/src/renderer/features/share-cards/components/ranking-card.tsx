import type { ShareCardData } from "../types";
import { CARD_BG, monoStyle, shareCardRoot } from "../utils/card-styles";
import { CardChrome, CardBackdropBars, CardUserRow, FlameIcon, planLabel } from "./card-chrome";

interface RankingCardProps {
  data: ShareCardData;
  percentile?: number;
  rank?: number;
  totalUsers?: number;
}

export function RankingCard({
  data,
  percentile = 4,
  rank = 87,
  totalUsers = 2180,
}: RankingCardProps) {
  return (
    <div style={{ ...shareCardRoot, background: CARD_BG.gold }}>
      <CardBackdropBars />
      <CardChrome label="RANKING GLOBAL" />

      <CardUserRow name={data.userName} subtitle={planLabel(data.plan)} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 24,
          position: "relative",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div
            style={{
              ...monoStyle,
              fontSize: 11,
              letterSpacing: ".2em",
              color: "#f5a623",
              marginBottom: 8,
            }}
          >
            VOCÊ ESTÁ NO
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span
              style={{
                fontSize: 84,
                fontWeight: 600,
                letterSpacing: "-.045em",
                lineHeight: 1,
                color: "#f5a623",
              }}
            >
              TOP {percentile}%
            </span>
          </div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,.7)",
              marginTop: 8,
              lineHeight: 1.45,
              maxWidth: "30ch",
            }}
          >
            dos usuários do Shadow Whisper. Posição{" "}
            <b style={{ color: "#fff", fontWeight: 500 }}>#{rank}</b> de{" "}
            {totalUsers.toLocaleString("pt-BR")}.
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          position: "relative",
          fontSize: 12.5,
          color: "rgba(255,255,255,.6)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <b style={{ color: "#fff", fontWeight: 500 }}>
            {data.totalWords.toLocaleString("pt-BR")}
          </b>{" "}
          palavras
        </span>
        <span
          style={{
            width: 1,
            height: 14,
            background: "rgba(255,255,255,.15)",
          }}
        />
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#f5a623",
          }}
        >
          <FlameIcon size={13} />
          <b style={{ color: "#fff", fontWeight: 500 }}>{data.currentStreak} dias</b>
          <span style={{ color: "rgba(255,255,255,.55)" }}>de streak</span>
        </span>
      </div>
    </div>
  );
}
