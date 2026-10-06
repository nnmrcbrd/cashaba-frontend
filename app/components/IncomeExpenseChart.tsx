"use client";

import { useId, useMemo, useState } from 'react';
import { buildIncomeExpenseTrend, operatingGap, trendScaleMaximum, type TrendEntry } from '@/lib/incomeExpenseTrend';

const php = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
const shortDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-PH', { timeZone: 'UTC', month: 'short', day: 'numeric' });

export default function IncomeExpenseChart({ trend, start, end, income, expense }: {
  trend: TrendEntry[]; start: string; end: string; income: number; expense: number;
}) {
  const buckets = useMemo(() => buildIncomeExpenseTrend(trend, start, end), [trend, start, end]);
  const chartId = useId();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selected = buckets.find(bucket => bucket.date === selectedDate) ?? buckets.findLast(bucket => bucket.income > 0 || bucket.expense > 0) ?? buckets[0];
  const gap = operatingGap(income, expense);
  const maximum = trendScaleMaximum(buckets);
  const groupWidth = 536 / Math.max(1, buckets.length);
  const barWidth = Math.min(22, groupWidth * 0.32);
  const y = (amount: number) => 184 - amount / maximum * 160;
  const grouped = buckets.some(bucket => bucket.date !== bucket.endDate);
  const hasActivity = income !== 0 || expense !== 0;

  return <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6">
    <h2 id={`${chartId}-title`} className="text-sm font-bold">Income versus expenses</h2>
    <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 text-xs">
      <span className="text-slate-500">Selected period gap · income minus spending</span>
      <strong className={gap.amount < 0 ? 'text-red-600' : 'text-emerald-700'}>{gap.label}{hasActivity ? `: ${php(Math.abs(gap.amount))}` : ''}</strong>
    </div>
    {hasActivity ? <>
      <div className="mt-3 overflow-x-auto">
        <svg viewBox="0 0 640 222" className="w-full min-w-[400px]" role="group" aria-labelledby={`${chartId}-title ${chartId}-description`}>
          <desc id={`${chartId}-description`}>Recorded income and spending for the selected Manila calendar period. Select a date to read its amounts. Days without entries show zero recorded amounts.</desc>
          {Array.from({ length: 5 }, (_, index) => {
            const amount = maximum * index / 4;
            return <g key={index}>
              <line x1="78" x2="622" y1={y(amount)} y2={y(amount)} stroke="#e2e8f0" />
              <text x="70" y={y(amount) + 4} textAnchor="end" fontSize="11" fill="#64748b">₱{amount.toLocaleString('en-PH', { maximumFractionDigits: amount < 1 ? 2 : 0 })}</text>
            </g>;
          })}
          {buckets.map((bucket, index) => {
            const x = 82 + (index + 0.5) * groupWidth;
            const range = bucket.date === bucket.endDate ? shortDate(bucket.date) : `${shortDate(bucket.date)}–${shortDate(bucket.endDate)}`;
            const detail = `${range}: income ${php(bucket.income)}, spending ${php(bucket.expense)}, gap ${php(bucket.income - bucket.expense)}`;
            return <g key={bucket.date} role="button" tabIndex={0} aria-label={detail} aria-pressed={selected?.date === bucket.date}
              className="cursor-pointer outline-none" onMouseEnter={() => setSelectedDate(bucket.date)} onFocus={() => setSelectedDate(bucket.date)} onClick={() => setSelectedDate(bucket.date)}
              onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedDate(bucket.date); } }}>
              <title>{detail}</title>
              <rect x={x - groupWidth / 2} y="18" width={groupWidth} height="170" fill={buckets.length > 1 && selected?.date === bucket.date ? '#ecfdf5' : 'transparent'} />
              <rect x={x - barWidth - 1} y={y(bucket.income)} width={barWidth} height={184 - y(bucket.income)} rx="2" fill="#059669" />
              <rect x={x + 1} y={y(bucket.expense)} width={barWidth} height={184 - y(bucket.expense)} rx="2" fill="#dc2626" />
              {(index % Math.max(1, Math.ceil(buckets.length / 6)) === 0 || index === buckets.length - 1) && <text x={x} y="208" textAnchor="middle" fontSize="10" fill="#64748b">{shortDate(bucket.date)}</text>}
            </g>;
          })}
        </svg>
      </div>
      {selected && <div aria-live="polite" className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
        <strong className="text-slate-800">{shortDate(selected.date)}{selected.date !== selected.endDate ? `–${shortDate(selected.endDate)}` : ''}</strong>
        <span className="ml-3 text-emerald-700">Income {php(selected.income)}</span>{' · '}
        <span className="text-red-600">Spending {php(selected.expense)}</span>{' · '}
        <span>Gap {php(Math.round((selected.income - selected.expense) * 100) / 100)}</span>
      </div>}
    </> : <p className="flex h-48 items-center justify-center text-center text-xs text-slate-500">No income or spending has been recorded for this period.</p>}
    <div className="mt-3 flex flex-wrap gap-4 text-[10px] font-bold"><span className="text-emerald-700">● Income received</span><span className="text-red-600">● Spending &amp; debt payments</span></div>
    <p className="mt-2 text-[10px] leading-4 text-slate-500">{grouped ? 'Amounts are grouped by date range for this longer period. ' : 'Daily recorded amounts. '}Days without entries show ₱0; future dates do not predict activity. Hover, select or focus a date to view its values.</p>
  </article>;
}
