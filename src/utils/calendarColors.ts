export type ColorToken =
  | 'indigo' | 'rose' | 'emerald' | 'amber' | 'violet' | 'sky'
  | 'fuchsia' | 'cyan' | 'lime' | 'orange' | 'slate';

export const PALETTE: Record<ColorToken, { bg: string; text: string; border: string; dot: string; hover: string }> = {
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-300 dark:border-indigo-700', dot: 'bg-indigo-500', hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/40' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-950/30',     text: 'text-rose-700 dark:text-rose-300',       border: 'border-rose-300 dark:border-rose-700',       dot: 'bg-rose-500',   hover: 'hover:bg-rose-100 dark:hover:bg-rose-900/40' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700', dot: 'bg-emerald-500', hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-950/30',   text: 'text-amber-800 dark:text-amber-300',     border: 'border-amber-300 dark:border-amber-700',     dot: 'bg-amber-500',  hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/40' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-300',   border: 'border-violet-300 dark:border-violet-700',   dot: 'bg-violet-500', hover: 'hover:bg-violet-100 dark:hover:bg-violet-900/40' },
  sky:     { bg: 'bg-sky-50 dark:bg-sky-950/30',       text: 'text-sky-700 dark:text-sky-300',         border: 'border-sky-300 dark:border-sky-700',         dot: 'bg-sky-500',    hover: 'hover:bg-sky-100 dark:hover:bg-sky-900/40' },
  fuchsia: { bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30', text: 'text-fuchsia-700 dark:text-fuchsia-300', border: 'border-fuchsia-300 dark:border-fuchsia-700', dot: 'bg-fuchsia-500', hover: 'hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/40' },
  cyan:    { bg: 'bg-cyan-50 dark:bg-cyan-950/30',     text: 'text-cyan-700 dark:text-cyan-300',       border: 'border-cyan-300 dark:border-cyan-700',       dot: 'bg-cyan-500',   hover: 'hover:bg-cyan-100 dark:hover:bg-cyan-900/40' },
  lime:    { bg: 'bg-lime-50 dark:bg-lime-950/30',     text: 'text-lime-700 dark:text-lime-300',       border: 'border-lime-300 dark:border-lime-700',       dot: 'bg-lime-500',   hover: 'hover:bg-lime-100 dark:hover:bg-lime-900/40' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-300',   border: 'border-orange-300 dark:border-orange-700',   dot: 'bg-orange-500', hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/40' },
  slate:   { bg: 'bg-slate-50 dark:bg-slate-900/40',   text: 'text-slate-700 dark:text-slate-300',     border: 'border-slate-300 dark:border-slate-700',     dot: 'bg-slate-500',  hover: 'hover:bg-slate-100 dark:hover:bg-slate-800/50' },
};

export const TOKENS: ColorToken[] = ['indigo','rose','emerald','amber','violet','sky','fuchsia','cyan','lime','orange','slate'];

export function pickTokenFromId(id?: string): ColorToken {
  if (!id) return 'indigo';
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TOKENS[h % TOKENS.length];
}

export function getEventClasses(color?: string) {
  const token = (TOKENS as readonly string[]).includes(color as any) ? (color as ColorToken) : undefined;
  return PALETTE[token || 'indigo'];
}
