export const DEFAULT_REPOSITORY_VERSION = 'smartbin:bulky:v1';

export const DEFAULT_PRICE_BOOK = Object.freeze({
  version: '2026.1',
  items: {
    SOFA: 150000,
    MATTRESS: 100000,
    CABINET: 120000,
    TABLE: 80000,
  },
  floorFee: 20000,
  disassemblyFee: 30000,
  serviceAreaFees: {
    D1: 25000,
    D2: 30000,
    D5: 25000,
  },
  vehicleFees: {
    STANDARD_VAN: 50000,
    HEAVY_TRUCK: 100000,
  },
  scope: ['Door-to-door pickup', 'Bulky waste handling and transport'],
  exclusions: ['Hazardous waste', 'Medical waste', 'Construction debris'],
  cancellationPolicyVersion: '2026.1',
});

export const DEFAULT_ACCEPTED_ITEMS = Object.freeze([
  {
    code: 'SOFA',
    displayName: 'Sofa / Ghế bành dài',
    category: 'FURNITURE',
    maxQuantity: 5,
    defaultDimensionsCm: { length: 200, width: 90, height: 85 },
    notes: 'Bao gồm sofa đơn, sofa đôi hoặc bộ salon gỗ/da',
  },
  {
    code: 'MATTRESS',
    displayName: 'Nệm / Đệm',
    category: 'BEDDING',
    maxQuantity: 5,
    defaultDimensionsCm: { length: 180, width: 160, height: 20 },
    notes: 'Nệm cao su, nệm lò xo, đệm bông ép',
  },
  {
    code: 'CABINET',
    displayName: 'Tủ gỗ / Tủ quần áo',
    category: 'FURNITURE',
    maxQuantity: 3,
    defaultDimensionsCm: { length: 120, width: 60, height: 180 },
    notes: 'Tủ quần áo, tủ chén, kệ sách lớn',
  },
  {
    code: 'TABLE',
    displayName: 'Bàn lớn / Bàn ăn',
    category: 'FURNITURE',
    maxQuantity: 5,
    defaultDimensionsCm: { length: 140, width: 80, height: 75 },
    notes: 'Bàn ăn gia đình, bàn làm việc gỗ khối',
  },
]);

export function createDefaultSeed() {
  return {
    version: DEFAULT_REPOSITORY_VERSION,
    priceBook: JSON.parse(JSON.stringify(DEFAULT_PRICE_BOOK)),
    acceptedItems: JSON.parse(JSON.stringify(DEFAULT_ACCEPTED_ITEMS)),
    households: {
      'hh-1': {
        id: 'hh-1',
        name: 'Hộ gia đình Nguyễn Văn A',
        serviceLocations: [
          {
            id: 'loc-1',
            address: '123 Nguyen Trai, Phuong 3, Quan 5, TP.HCM',
            latitude: 10.756,
            longitude: 106.678,
            serviceArea: { code: 'D5' },
          },
        ],
      },
      'hh-2': {
        id: 'hh-2',
        name: 'Hộ gia đình Trần Thị B',
        serviceLocations: [
          {
            id: 'loc-2',
            address: '456 Tran Hung Dao, Quan 1, TP.HCM',
            latitude: 10.762,
            longitude: 106.685,
            serviceArea: { code: 'D1' },
          },
        ],
      },
    },
    orders: {},
    quotes: {},
    holds: {},
    payments: {},
    refunds: {},
    changeRequests: {},
    latePaymentResolutions: {},
    dispatchOutbox: [],
    idempotencyLedger: {},
  };
}
