import type { ReservationDraft } from './reservation';
import type { ReservationReceipt } from './reservation-context';

export type ReservationSessionState = {
  ownerId: string | null;
  draft: ReservationDraft;
  receipt: ReservationReceipt | null;
};

export function reservationSession(ownerId: string | null, initial: ReservationDraft): ReservationSessionState {
  return { ownerId, draft: { ...initial }, receipt: null };
}

export function updateSessionDraft(state: ReservationSessionState, ownerId: string | null, patch: Partial<ReservationDraft>): ReservationSessionState {
  return state.ownerId === ownerId ? { ...state, draft: { ...state.draft, ...patch } } : state;
}

export function updateSessionReceipt(state: ReservationSessionState, ownerId: string | null, receipt: ReservationReceipt | null): ReservationSessionState {
  return state.ownerId === ownerId ? { ...state, receipt } : state;
}
