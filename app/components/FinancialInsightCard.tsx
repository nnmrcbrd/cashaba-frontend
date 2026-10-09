import type { CSSProperties } from "react";

export type FinancialInsightTone = "emerald" | "blue" | "amber" | "violet";

interface FinancialInsightCardProps {
  title: string;
  message: string;
  tone: FinancialInsightTone;
  icon?: string;
  className?: string;
  style?: CSSProperties;
}

export default function FinancialInsightCard({
  title,
  message,
  tone,
  icon,
  className = "",
  style,
}: FinancialInsightCardProps) {
  return (
    <article
      className={`financial-insight-card rounded-2xl border p-4 shadow-sm ${className}`}
      data-insight-tone={tone}
      style={style}
    >
      <div className="flex items-start gap-3">
        {icon && <span className="shrink-0 text-xl" aria-hidden="true">{icon}</span>}
        <div className="min-w-0">
          <p className="financial-insight-card__label text-[10px] font-extrabold uppercase tracking-[0.12em]">{title}</p>
          <p className="mt-2 text-xs font-medium leading-5">{message}</p>
        </div>
      </div>
    </article>
  );
}
