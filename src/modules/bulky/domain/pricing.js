import { BulkyServiceError } from './errors.js';
import { MATERIAL_FACTORS } from './constants.js';

const asVnd = (value, field) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0)
    throw new BulkyServiceError('VALIDATION', `${field} must be a non-negative integer`);
  return n;
};

const stable = (value) => {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(value[key])}`)
      .join(',')}}`;
  return JSON.stringify(value);
};

export function calculateQuote({
  confirmedItems = [],
  handlingConditions = {},
  serviceArea,
  priceBook,
  now,
  serviceWindow,
  quoteTtlMinutes = 30,
}) {
  if (
    !priceBook?.version ||
    !serviceArea ||
    !now ||
    !Array.isArray(confirmedItems) ||
    !confirmedItems.length
  )
    throw new BulkyServiceError('VALIDATION', 'Incomplete quote input');
  const lineItems = [];
  let subtotalVnd = 0;
  for (const item of confirmedItems) {
    const code = item.catalogItemCode || item.itemType;
    const quantity = asVnd(item.quantity, 'quantity');
    const defaultBasePrices = {
      SOFA: 150000,
      MATTRESS: 100000,
      CABINET: 120000,
      TABLE: 80000,
      OTHER: 60000,
    };
    const rawPrice =
      priceBook.items?.[code] !== undefined ? priceBook.items[code] : defaultBasePrices[code] || 60000;
    const baseUnitVnd = asVnd(rawPrice, `priceBook.items.${code}`);
    const material = item.material || 'STANDARD';
    const factor = MATERIAL_FACTORS[material]?.priceFactor || 1;

    const unitPriceVnd = Math.round(baseUnitVnd * factor);
    const amountVnd = quantity * unitPriceVnd;
    const itemMinVnd = amountVnd;
    const itemMaxVnd = Math.round(amountVnd * 1.3);
    lineItems.push({
      code,
      label: item.displayName || code,
      material,
      quantity,
      unitPriceVnd,
      amountVnd,
      itemMinVnd,
      itemMaxVnd,
    });
    subtotalVnd += amountVnd;
  }
  const add = (code, label, amount) => {
    const amountVnd = asVnd(amount || 0, code);
    if (amountVnd) lineItems.push({ code, label, quantity: 1, unitPriceVnd: amountVnd, amountVnd });
    subtotalVnd += amountVnd;
  };
  if (handlingConditions.floorNumber > 0) add('FLOOR_FEE', 'Floor handling', priceBook.floorFee);
  if (handlingConditions.requiresDisassembly)
    add('DISASSEMBLY', 'Disassembly', priceBook.disassemblyFee);
  if (handlingConditions.vehicleClass)
    add('VEHICLE_FEE', 'Vehicle class', priceBook.vehicleFees?.[handlingConditions.vehicleClass]);
  const areaCode = typeof serviceArea === 'string' ? serviceArea : serviceArea.code;
  add('SERVICE_AREA_FEE', 'Service area', priceBook.serviceAreaFees?.[areaCode]);
  const discountVnd = asVnd(priceBook.discountVnd || 0, 'discountVnd');
  const taxVnd = asVnd(priceBook.taxVnd || 0, 'taxVnd');
  if (discountVnd)
    lineItems.push({
      code: 'DISCOUNT',
      label: 'Discount',
      quantity: 1,
      unitPriceVnd: -discountVnd,
      amountVnd: -discountVnd,
    });
  if (taxVnd)
    lineItems.push({
      code: 'TAX',
      label: 'Tax',
      quantity: 1,
      unitPriceVnd: taxVnd,
      amountVnd: taxVnd,
    });
  const createdAt = now;
  const expiresAt = new Date(new Date(now).getTime() + quoteTtlMinutes * 60000).toISOString();
  const totalVnd = subtotalVnd - discountVnd + taxVnd;
  const minVnd = totalVnd;
  const maxVnd = Math.round(minVnd * 1.3);
  const estimatedRange = {
    minVnd,
    maxVnd,
    depositHoldVnd: minVnd,
  };
  const tolerancePolicy = {
    allowedPercent: 15,
    message:
      'Miễn phí phụ thu nếu khối lượng hoặc kích thước thực tế sai lệch không quá ±15% so với khai báo.',
  };
  return {
    quoteId: `quote-${new Date(now).getTime()}`,
    priceBookVersion: priceBook.version,
    confirmedInputHash: stable({ confirmedItems, handlingConditions, serviceArea }),
    serviceWindow,
    lineItems,
    subtotalVnd,
    discountVnd,
    taxVnd,
    totalVnd,
    estimatedRange,
    tolerancePolicy,
    currency: 'VND',
    scope: priceBook.scope || [],
    exclusions: priceBook.exclusions || [],
    cancellationPolicyVersion: priceBook.cancellationPolicyVersion || 'v1',
    status: 'ACTIVE',
    expiresAt,
    createdAt,
  };
}

export const isQuoteExpired = (quote, now) =>
  new Date(now).getTime() >= new Date(quote.expiresAt).getTime();
