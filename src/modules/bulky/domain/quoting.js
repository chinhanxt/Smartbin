import { BulkyServiceError } from './errors.js';

const integer = (value, name) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0)
    throw new BulkyServiceError('VALIDATION', `${name} must be a non-negative integer`);
  return number;
};

export function calculateQuote({
  confirmedItems = [],
  handlingConditions = {},
  serviceArea,
  priceBook,
  now = new Date().toISOString(),
}) {
  if (
    !priceBook?.version ||
    !serviceArea ||
    !Array.isArray(confirmedItems) ||
    confirmedItems.length === 0
  )
    throw new BulkyServiceError('VALIDATION', 'Incomplete quote input');
  const lineItems = [];
  let subtotalVnd = 0;
  for (const item of confirmedItems) {
    if (!item?.itemType || !priceBook.items?.[item.itemType])
      throw new BulkyServiceError('VALIDATION', 'Unsupported item');
    const quantity = integer(item.quantity, 'quantity');
    const unitPriceVnd = integer(priceBook.items[item.itemType], 'unitPriceVnd');
    const amountVnd = quantity * unitPriceVnd;
    lineItems.push({
      code: item.itemType,
      label: item.itemType,
      quantity,
      unitPriceVnd,
      amountVnd,
    });
    subtotalVnd += amountVnd;
  }
  const add = (code, label, amount) => {
    const amountVnd = integer(amount ?? 0, code);
    if (amountVnd) {
      lineItems.push({ code, label, quantity: 1, unitPriceVnd: amountVnd, amountVnd });
      subtotalVnd += amountVnd;
    }
  };
  add('FLOOR_FEE', 'Floor handling', handlingConditions.floorNumber > 0 ? priceBook.floorFee : 0);
  add(
    'DISASSEMBLY',
    'Disassembly',
    handlingConditions.requiresDisassembly ? priceBook.disassemblyFee : 0,
  );
  const discountVnd = integer(priceBook.discountVnd ?? 0, 'discountVnd');
  const taxVnd = integer(priceBook.taxVnd ?? 0, 'taxVnd');
  return {
    quoteId: `quote-${Date.now()}`,
    priceBookVersion: priceBook.version,
    serviceArea,
    confirmedInputHash: JSON.stringify(confirmedItems),
    lineItems,
    subtotalVnd,
    discountVnd,
    taxVnd,
    totalVnd: subtotalVnd - discountVnd + taxVnd,
    currency: 'VND',
    createdAt: now,
    status: 'ACTIVE',
  };
}
