import { DISPATCH_EVENT_TYPE, ORDER_STATUS, PAYMENT_STATUS } from './constants.js';
import { BulkyServiceError } from './errors.js';

const committed = (order) => {
  if (
    !order?.orderId ||
    !Number.isInteger(order.confirmationVersion) ||
    order.confirmationVersion < 1
  )
    throw new BulkyServiceError('VALIDATION', 'Invalid confirmation');
  if (
    order.paymentStatus !== PAYMENT_STATUS.SUCCESS &&
    order.acceptedPayment?.status !== PAYMENT_STATUS.SUCCESS
  )
    throw new BulkyServiceError('CONFLICT', 'Order was not paid');
  if (
    order.orderStatus !== ORDER_STATUS.CONFIRMED &&
    order.orderStatus !== ORDER_STATUS.ASSIGNED &&
    order.orderStatus !== ORDER_STATUS.IN_PROGRESS &&
    order.orderStatus !== ORDER_STATUS.COMPLETED &&
    order.orderStatus !== ORDER_STATUS.CANCELLED &&
    order.status !== ORDER_STATUS.CONFIRMED
  )
    throw new BulkyServiceError('CONFLICT', 'Order was not confirmed');
};

export function toDispatchBulkyWasteOrder(order) {
  committed(order);
  const items = order.confirmedItems || [];
  const counts = items.reduce((map, item) => {
    const code = item.catalogItemCode || item.itemType || 'OTHER';
    map[code] = (map[code] || 0) + Number(item.quantity || 0);
    return map;
  }, {});
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const itemType =
    ranked.length > 1 && ranked[0][1] === ranked[1][1]
      ? 'OTHER'
      : ranked[0]?.[0] || order.itemType || 'OTHER';
  const location = order.serviceLocation || {};
  const payment = order.acceptedPayment || {};
  return {
    orderId: order.orderId,
    householdId: order.householdId,
    itemType,
    itemsCount: Object.values(counts).reduce((sum, n) => sum + n, 0) || order.itemsCount,
    pickupDate:
      order.confirmedServiceWindow?.date ||
      order.confirmedServiceWindow?.start?.slice(0, 10) ||
      order.requestedDate ||
      order.pickupDate,
    address: location.address || order.address,
    latitude: location.latitude ?? order.latitude,
    longitude: location.longitude ?? order.longitude,
    hasElevator: order.handlingConditions?.hasLift ?? order.hasElevator,
    floor: order.handlingConditions?.floorNumber ?? order.floor,
    totalPriceVnd: order.acceptedQuote?.totalVnd ?? order.totalPriceVnd,
    isPaid: true,
    paymentTransactionId: payment.transactionReference || order.paymentTransactionId,
    status: order.orderStatus === ORDER_STATUS.COMPLETED ? 'COLLECTED' : 'PAID_CONFIRMED',
  };
}

export function createDispatchEvent(order, type, now = new Date().toISOString()) {
  committed(order);
  if (!Object.values(DISPATCH_EVENT_TYPE).includes(type))
    throw new BulkyServiceError('VALIDATION', 'Unknown event type');
  const event = {
    eventId: `${order.orderId}:${order.confirmationVersion}:${type}`,
    type,
    orderId: order.orderId,
    confirmationVersion: order.confirmationVersion,
    occurredAt: now,
  };
  if (type === DISPATCH_EVENT_TYPE.UPSERT) event.order = toDispatchBulkyWasteOrder(order);
  else event.cancellation = { reason: order.cancellationReason || 'CANCELLED' };
  return event;
}
