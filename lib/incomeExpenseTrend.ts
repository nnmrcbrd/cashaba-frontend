export interface TrendEntry { date: string; income: number; expense: number }
export interface TrendBucket extends TrendEntry { endDate: string }
const DAY = 86_400_000;
const label = (time: number) => new Date(time).toISOString().slice(0, 10);

export function manilaDateLabel(value: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}

// Include days with no recorded movements. Long custom periods use at most 31
// equally sized calendar-day buckets, without interpolating or inventing money.
export function buildIncomeExpenseTrend(trend: TrendEntry[], start: string, end: string): TrendBucket[] {
  const first = Date.parse(`${manilaDateLabel(start)}T00:00:00Z`);
  const last = Date.parse(`${manilaDateLabel(end)}T00:00:00Z`);
  if (!Number.isFinite(first) || !Number.isFinite(last) || first > last) return [];
  const days = Math.round((last - first) / DAY) + 1;
  const bucketDays = Math.ceil(days / 31);
  const buckets: TrendBucket[] = Array.from({ length: Math.ceil(days / bucketDays) }, (_, index) => {
    const time = first + index * bucketDays * DAY;
    return { date: label(time), endDate: label(Math.min(last, time + (bucketDays - 1) * DAY)), income: 0, expense: 0 };
  });
  for (const entry of trend) {
    const time = Date.parse(`${entry.date}T00:00:00Z`);
    if (!Number.isFinite(time) || time < first || time > last) continue;
    const bucket = buckets[Math.floor((time - first) / DAY / bucketDays)];
    bucket.income += entry.income;
    bucket.expense += entry.expense;
  }
  return buckets.map(bucket => ({ ...bucket, income: Math.round(bucket.income * 100) / 100, expense: Math.round(bucket.expense * 100) / 100 }));
}

export function trendScaleMaximum(buckets: TrendEntry[]) {
  const maximum = Math.max(1, ...buckets.flatMap(bucket => [bucket.income, bucket.expense]));
  const magnitude = 10 ** Math.floor(Math.log10(maximum / 4));
  const factor = [1, 2, 5, 10].find(value => value * magnitude >= maximum / 4)!;
  return factor * magnitude * 4;
}

export function operatingGap(income: number, expense: number) {
  const amount = Math.round((income - expense) * 100) / 100;
  return { amount, label: income === 0 && expense === 0 ? 'No recorded activity' : amount < 0 ? 'Shortfall' : amount > 0 ? 'Income above spending' : 'Income equals spending' };
}
