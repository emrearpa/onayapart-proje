/** Recharts'in ozel tooltip bilesenine gecirdigi alanlardan kullandiklarimiz. */
export type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: { value: number; name?: string; dataKey?: string; color?: string; payload: { fill?: string } }[];
};
