import type { ShareCardData } from "../types";
import { CARD_BG, shareCardRoot } from "../utils/card-styles";
import { formatCompactNumber } from "../utils/format";
import { CardChrome, CardBackdropBars, CardUserRow, FlameIcon, planLabel } from "./card-chrome";

interface StatusCardProps {
  data: ShareCardData;
}

export function StatusCard({ data }: StatusCardProps) {
  return (
    <div style={{ ...shareCardRoot, background: CARD_BG.purple }}>
      <CardBackdropBars />
      <CardChrome />

      <CardUserRow
        name={data.userName}
        subtitle={planLabel(data.plan)}
        avatarSize={52}
        gap={14}
        marginTop={6}
        nameFontSize={15}
        subtitleFontSize={11.5}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: 600,
            letterSpacing: "-.04em",
            lineHeight: 1,
          }}
        >
          {data.totalWords.toLocaleString("pt-BR")}
        </div>
        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.7)", marginTop: 6 }}>
          palavras ditadas
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            maxWidth: "90%",
          }}
        >
          <span
            style={{
              padding: "5px 10px",
              borderRadius: 99,
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.1)",
              fontSize: 12,
            }}
          >
            {data.weeklyAvgWpm} PPM
          </span>
          <span
            style={{
              padding: "5px 10px",
              borderRadius: 99,
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.1)",
              fontSize: 12,
            }}
          >
            {formatCompactNumber(data.totalTranscriptions)} transcrições
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          position: "relative",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#f5a623",
            fontSize: 12.5,
          }}
        >
          <FlameIcon />
          <b style={{ color: "#fff", fontWeight: 500 }}>{data.currentStreak} dias</b>
          <span style={{ color: "rgba(255,255,255,.6)" }}>de streak</span>
        </span>
        <span
          style={{
            width: 1,
            height: 14,
            background: "rgba(255,255,255,.15)",
          }}
        />
        <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.6)" }}>
          Desde{" "}
          <b style={{ color: "#fff", fontWeight: 500 }}>
            {data.memberSince
              ? new Date(data.memberSince).toLocaleDateString("pt-BR", {
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </b>
        </span>
      </div>
    </div>
  );
}
