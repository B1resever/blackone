import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { initialReservation, ReservationDraft } from './reservation';
import { useAuth } from './auth-context';
import { reservationSession, updateSessionDraft, updateSessionReceipt } from './reservation-session-state';

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
  const { user } = useAuth();
  const ownerId = user?.id ?? null;
  const [state, setState] = useState(() => reservationSession(ownerId, initialReservation));
  // Reset before rendering children, so a changed account never sees the previous draft or receipt.
  const current = state.ownerId === ownerId ? state : reservationSession(ownerId, initialReservation);
  if (current !== state) setState(current);

  const value = useMemo<ReservationContextValue>(
    () => ({
      draft: current.draft,
      receipt: current.receipt,
      updateDraft: (patch) => setState((previous) => updateSessionDraft(previous, ownerId, patch)),
      setReceipt: (receipt) => setState((previous) => updateSessionReceipt(previous, ownerId, receipt)),
      resetDraft: () => setState((previous) => previous.ownerId === ownerId
        ? reservationSession(ownerId, initialReservation) : previous),
    }),
    [current, ownerId],
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
