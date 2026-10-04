import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { initialReservation, ReservationDraft } from './reservation';

export type ReservationReceipt = {
  requestCode: string;
  channel: 'one-api';
  rideCode?: string | null;
  quoteStatus?: 'quoted' | 'manual_confirmation' | 'rate_card_required';
  amountMinor?: number | null;
  currency?: string | null;
};

type ReservationContextValue = {
  draft: ReservationDraft;
  receipt: ReservationReceipt | null;
  updateDraft: (patch: Partial<ReservationDraft>) => void;
  setReceipt: (receipt: ReservationReceipt | null) => void;
  resetDraft: () => void;
};

const ReservationContext = createContext<ReservationContextValue | null>(null);

export function ReservationProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState<ReservationDraft>(initialReservation);
  const [receipt, setReceipt] = useState<ReservationReceipt | null>(null);

  const value = useMemo<ReservationContextValue>(
    () => ({
      draft,
      receipt,
      updateDraft: (patch) => setDraft((current) => ({ ...current, ...patch })),
      setReceipt,
      resetDraft: () => {
        setDraft(initialReservation);
        setReceipt(null);
      },
    }),
    [draft, receipt],
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
