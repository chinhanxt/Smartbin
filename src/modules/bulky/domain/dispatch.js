import { DISPATCH_EVENT_TYPE, ORDER_STATUS, PAYMENT_STATUS } from './constants.js';
import { BulkyServiceError } from './errors.js';

export function toDispatchBulkyWasteOrder(order) {
  if (
    !order ||
    order.status !== ORDER_STATUS.CONFIRMED ||
    order.paymentStatus !== PAYMENT_STATUS.SUCCESS
  )
    throw new BulkyServiceError('CONFLICT', 'Order is not paid and confirmed');
  return {
    orderId: order.orderId,
    householdId: order.householdId,
    itemType: order.itemType || 'OTHER',
    itemsCount: order.itemsCount,
    pickupDate: order.pickupDate,
    address: order.address,
    latitude: order.latitude,
    longitude: order.longitude,
    hasElevator: order.hasElevator,
    floor: order.floor,
    totalPriceVnd: order.totalPriceVnd,
    isPaid: true,
    paymentTransactionId: order.paymentTransactionId,
    status: 'PAID_CONFIRMED',
  };
}

export function createDispatchEvent(order, type) {
  if (!Object.values(DISPATCH_EVENT_TYPE).includes(type))
    throw new BulkyServiceError('VALIDATION', 'Unknown event type');
  const event = {
    eventId: `${order.orderId}:${order.confirmationVersion}:${type}`,
    type,
    orderId: order.orderId,
    confirmationVersion: order.confirmationVersion,
    occurredAt: order.updatedAt || new Date().toISOString(),
  };
  if (type === DISPATCH_EVENT_TYPE.UPSERT) event.order = toDispatchBulkyWasteOrder(order);
  else event.cancellation = { reason: order.cancellationReason || 'CANCELLED' };
  return event;
}
