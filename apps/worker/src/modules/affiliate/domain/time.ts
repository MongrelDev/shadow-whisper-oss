export type IsoDateTime = string;

export const nowIso = (): IsoDateTime => new Date().toISOString();

export const addDaysIso = (iso: IsoDateTime, days: number): IsoDateTime => {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
};
