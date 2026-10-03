import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { initialReservation, ReservationDraft } from './reservation';

type ReservationContextValue = {
  draft: ReservationDraft;
  updateDraft: (patch: Partial<ReservationDraft>) => void;
  resetDraft: () => void;
};

const ReservationContext = createContext<ReservationContextValue | null>(null);

export function ReservationProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState<ReservationDraft>(initialReservation);

  const value = useMemo<ReservationContextValue>(
    () => ({
      draft,
      updateDraft: (patch) => setDraft((current) => ({ ...current, ...patch })),
      resetDraft: () => setDraft(initialReservation),
    }),
    [draft],
  );

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}

export function useReservation() {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation must be used inside ReservationProvider');
  }
  return context;
}
