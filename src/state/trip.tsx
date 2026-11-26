import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { EMPTY_DRAFT, tripReducer, type TripAction } from '../domain/draft.ts';
import { readJSON, writeJSON } from '../services/storage.ts';
import type { TripDraft } from '../domain/types.ts';

export { reachedStep } from '../domain/draft.ts';

const KEY = 'pr.draft';
const Ctx = createContext<{ draft: TripDraft; dispatch: (a: TripAction) => void } | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [draft, dispatch] = useReducer(tripReducer, undefined, () => ({ ...EMPTY_DRAFT, ...readJSON<Partial<TripDraft>>('session', KEY, {}) }));
  useEffect(() => { writeJSON('session', KEY, draft); }, [draft]);
  const v = useMemo(() => ({ draft, dispatch }), [draft]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export function useTrip() {
  const v = useContext(Ctx);
  if (!v) throw new Error('TripProvider missing');
  return v;
}

