import type { ReservationDraft } from './reservation';
import type { ReservationReceipt } from './reservation-context';

export type ReservationSessionState = {
  ownerId: string | null;
  generation: number;
  draft: ReservationDraft;
  receipt: ReservationReceipt | null;
};

export function reservationSession(ownerId: string | null, initial: ReservationDraft, generation = 0): ReservationSessionState {
  return { ownerId, generation, draft: { ...initial }, receipt: null };
}

export function updateSessionDraft(state: ReservationSessionState, ownerId: string | null, patch: Partial<ReservationDraft>, generation = 0): ReservationSessionState {
  return state.ownerId === ownerId && state.generation === generation ? { ...state, draft: { ...state.draft, ...patch } } : state;
}

export function updateSessionReceipt(state: ReservationSessionState, ownerId: string | null, receipt: ReservationReceipt | null, generation = 0): ReservationSessionState {
  return state.ownerId === ownerId && state.generation === generation ? { ...state, receipt } : state;
}
