export interface GuestState {
  lastActivityAt: number;
}

export const INITIAL_GUEST_STATE: GuestState = {
  lastActivityAt: 0,
};
