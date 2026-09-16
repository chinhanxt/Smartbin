import { CHANGE_DECISION, ORDER_STATUS } from './constants.js';

const transitions = {
  DRAFT: {
    SUBMIT: 'NEEDS_INFO',
    NEEDS_INFO: 'NEEDS_INFO',
    REQUIRE_REVIEW: 'MANUAL_REVIEW',
    READY_FOR_PAYMENT: 'AWAITING_PAYMENT',
  },
  NEEDS_INFO: { REQUIRE_REVIEW: 'MANUAL_REVIEW', READY_FOR_PAYMENT: 'AWAITING_PAYMENT' },
  MANUAL_REVIEW: {
    NEEDS_INFO: 'NEEDS_INFO',
    READY_FOR_PAYMENT: 'AWAITING_PAYMENT',
    CANCEL: 'CANCELLED',
  },
  AWAITING_PAYMENT: { PAYMENT_SUCCEEDED: 'CONFIRMED', CANCEL: 'CANCELLED' },
  CONFIRMED: { ASSIGN: 'ASSIGNED', CANCEL: 'CANCELLED' },
  ASSIGNED: { START: 'IN_PROGRESS', UNASSIGN: 'CONFIRMED', CANCEL: 'CANCELLED' },
  IN_PROGRESS: { COMPLETE: 'COMPLETED' },
  COMPLETED: {},
  CANCELLED: {},
};

export function transitionOrder(current, event) {
  return transitions[current]?.[event] ?? null;
}

export function evaluateChangePolicy({ order, requestedAt, now, policy = {} }) {
  const currentStatus = order?.status;
  if (
    [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED].includes(
      currentStatus,
    )
  ) {
    return {
      decision: CHANGE_DECISION.REJECTED,
      preservesCurrentBooking: currentStatus !== ORDER_STATUS.CANCELLED,
      reason: 'ORDER_NOT_CHANGEABLE',
    };
  }
  const requested = new Date(requestedAt).getTime();
  const current = new Date(now).getTime();
  const cutoffHours = Number(policy.cutoffHours ?? 24);
  const cutoff =
    new Date(
      order?.serviceWindow?.start ?? order?.serviceWindow?.date ?? order?.pickupDate ?? now,
    ).getTime() -
    cutoffHours * 3600000;
  const beforeCutoff = requested <= cutoff && current <= cutoff;
  return {
    decision: beforeCutoff ? CHANGE_DECISION.ALLOWED : CHANGE_DECISION.REVIEW,
    preservesCurrentBooking: true,
    reason: beforeCutoff ? 'BEFORE_CUTOFF' : 'AFTER_CUTOFF',
  };
}
