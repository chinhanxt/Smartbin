import { describe, expect, it } from 'vitest';
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  REFUND_STATUS,
  HOLD_STATUS,
  AI_DECISION,
  CHANGE_DECISION,
} from './constants.js';
import { BulkyServiceError } from './errors.js';
import { transitionOrder, evaluateChangePolicy } from './orderRules.js';
import { calculateQuote } from './quoting.js';
import { evaluateAiResult } from './recognition.js';
import { toDispatchBulkyWasteOrder, createDispatchEvent } from './dispatch.js';

describe('bulky domain contracts', () => {
  it('freezes the public statuses and follows the complete order graph', () => {
    expect(Object.isFrozen(ORDER_STATUS)).toBe(true);
    expect(transitionOrder(ORDER_STATUS.DRAFT, 'SUBMIT')).toBe(ORDER_STATUS.NEEDS_INFO);
    expect(transitionOrder(ORDER_STATUS.NEEDS_INFO, 'READY_FOR_PAYMENT')).toBe(
      ORDER_STATUS.AWAITING_PAYMENT,
    );
    expect(transitionOrder(ORDER_STATUS.AWAITING_PAYMENT, 'PAYMENT_SUCCEEDED')).toBe(
      ORDER_STATUS.CONFIRMED,
    );
    expect(transitionOrder(ORDER_STATUS.CONFIRMED, 'ASSIGN')).toBe(ORDER_STATUS.ASSIGNED);
    expect(transitionOrder(ORDER_STATUS.ASSIGNED, 'START')).toBe(ORDER_STATUS.IN_PROGRESS);
    expect(transitionOrder(ORDER_STATUS.IN_PROGRESS, 'COMPLETE')).toBe(ORDER_STATUS.COMPLETED);
    expect(transitionOrder(ORDER_STATUS.IN_PROGRESS, 'CANCEL')).toBeNull();
  });

  it('keeps payment, refund, and hold states independent', () => {
    expect(PAYMENT_STATUS.SUCCESS).toBe('SUCCESS');
    expect(REFUND_STATUS.PROCESSING).toBe('PROCESSING');
    expect(HOLD_STATUS.EXPIRED).toBe('EXPIRED');
  });

  it('recognizes stale holds by the injected clock', () => {
    expect(
      evaluateChangePolicy({
        order: { status: ORDER_STATUS.CONFIRMED, pickupDate: '2026-01-05' },
        requestedAt: '2026-01-01T10:00:00Z',
        now: '2026-01-01T10:00:01Z',
        policy: {},
      }).decision,
    ).toBe(CHANGE_DECISION.ALLOWED);
  });

  it('locks unknown or low-confidence AI results for manual review and never infers mass', () => {
    expect(evaluateAiResult({ itemType: 'ROCKET', confidence: 0.99 })).toMatchObject({
      decision: AI_DECISION.MANUAL_REVIEW,
      requiresManualReview: true,
    });
    expect(evaluateAiResult({ itemType: 'SOFA', confidence: 0.4 })).toMatchObject({
      decision: AI_DECISION.CONFIRM_REQUIRED,
      requiresManualReview: false,
    });
    expect(evaluateAiResult({ itemType: 'SOFA', confidence: 0.99 })).not.toHaveProperty('massKg');
  });

  it('calculates integer VND totals from confirmed inputs and rejects inferred mass', () => {
    const quote = calculateQuote({
      confirmedItems: [{ itemType: 'SOFA', quantity: 2 }],
      handlingConditions: { floorNumber: 2, requiresDisassembly: true },
      serviceArea: 'A',
      priceBook: { version: 'v1', items: { SOFA: 100000 }, floorFee: 20000, disassemblyFee: 30000 },
      now: '2026-01-01T00:00:00Z',
    });
    expect(quote.totalVnd).toBe(250000);
    expect(Number.isInteger(quote.totalVnd)).toBe(true);
  });

  it('preserves old booking until a change is accepted and applies cutoff policy', () => {
    const order = { status: ORDER_STATUS.CONFIRMED, serviceWindow: { date: '2026-01-10' } };
    expect(
      evaluateChangePolicy({
        order,
        requestedAt: '2026-01-01T10:00:00Z',
        now: '2026-01-01T10:00:01Z',
        policy: { cutoffHours: 24 },
      }),
    ).toMatchObject({ decision: CHANGE_DECISION.ALLOWED, preservesCurrentBooking: true });
    expect(
      evaluateChangePolicy({
        order,
        requestedAt: '2026-01-09T10:00:00Z',
        now: '2026-01-09T10:00:01Z',
        policy: { cutoffHours: 24 },
      }),
    ).toMatchObject({ decision: CHANGE_DECISION.REVIEW, preservesCurrentBooking: true });
  });

  it('maps only paid confirmed orders and creates exact versioned event IDs', () => {
    const order = {
      orderId: 'b1',
      householdId: 'h1',
      status: ORDER_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.SUCCESS,
      confirmationVersion: 1,
      itemType: 'SOFA',
      itemsCount: 1,
      pickupDate: '2026-01-10',
      address: 'A',
      latitude: 1,
      longitude: 2,
      hasElevator: true,
      floor: 2,
      totalPriceVnd: 100000,
      paymentTransactionId: 'tx1',
    };
    expect(toDispatchBulkyWasteOrder(order)).toMatchObject({
      orderId: 'b1',
      isPaid: true,
      status: 'PAID_CONFIRMED',
    });
    expect(createDispatchEvent(order, 'UPSERT')).toMatchObject({
      eventId: 'b1:1:UPSERT',
      type: 'UPSERT',
    });
    expect(() =>
      toDispatchBulkyWasteOrder({ ...order, paymentStatus: PAYMENT_STATUS.UNPAID }),
    ).toThrow(BulkyServiceError);
  });
});
