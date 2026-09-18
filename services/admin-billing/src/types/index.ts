// Domain models for Municipal Waste Billing Microservice

export type HouseholdType = 'RESIDENTIAL' | 'COMMERCIAL';
export type InvoiceStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentMethod = 'AUTO_DEBIT' | 'VIETQR' | 'VNPAY' | 'MOMO' | 'CASH' | 'NONE';

// Chức năng 8: Hóa đơn định kỳ
export interface Invoice {
  id: string; // e.g. INV-202609-01
  householdId: string; // HGD-TPTD-09218
  householdName: string;
  phone: string;
  address: string;
  householdType: HouseholdType;
  binId: string;
  billingCycle: string; // 09/2026
  baseFee: number; // 45,000đ hoặc 120,000đ
  overloadSurcharge: number; // Phụ thu vượt thể tích cảm biến
  environmentalFee: number; // Phí bảo vệ môi trường
  totalAmount: number;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
}

// Chức năng 9: Ủy quyền trích nợ tự động & Kênh thanh toán
export type MandateStatus = 'ACTIVE' | 'PENDING' | 'REVOKED' | 'FAILED';

export interface AutoDebitMandate {
  id: string; // AD-2026-008
  householdId: string;
  householdName: string;
  phone: string;
  address: string;
  bankName: string; // Vietcombank, BIDV, MB Bank, VietinBank, MoMo
  bankAccountNumber: string;
  accountHolder: string;
  mandateDate: string;
  status: MandateStatus;
  autoDebitDay: number; // Ngày 10 hằng tháng
  lastDebitStatus?: 'SUCCESS' | 'INSUFFICIENT_FUNDS' | 'ACCOUNT_LOCKED';
  lastDebitDate?: string;
  lastAmount?: number;
}

// Chức năng 10: Xác nhận & Đối soát thanh toán
export type MatchStatus = 'MATCHED' | 'DUPLICATE_FLAGGED' | 'MISMATCH_AMOUNT' | 'BANK_ONLY' | 'PENDING';

export interface ReconciliationEntry {
  id: string;
  transactionRef: string;
  invoiceId: string;
  householdName: string;
  channel: string;
  systemAmount: number;
  bankAmount: number;
  diffAmount: number;
  status: MatchStatus;
  bankTimestamp: string;
  systemTimestamp: string;
  antiDuplicationHash: string; // Khóa chống trùng lặp
  auditedBy?: string;
  note?: string;
}

export interface ReconciliationBatch {
  id: string;
  cycle: string;
  reconciliationDate: string;
  totalSystemInvoices: number;
  totalBankEntries: number;
  matchedCount: number;
  duplicatePreventedCount: number;
  discrepancyCount: number;
  totalSettledAmount: number;
  status: 'COMPLETED' | 'ACTION_REQUIRED';
}

// Chức năng 11: Nhắc phí & Cảnh báo quá hạn
export type DunningTier = 'T_MINUS_3' | 'T_DUE' | 'T_PLUS_5' | 'T_PLUS_15' | 'T_PLUS_30_CRITICAL';

export interface DunningRecord {
  id: string;
  householdId: string;
  householdName: string;
  phone: string;
  address: string;
  overdueDays: number;
  unpaidCount: number;
  totalDebt: number;
  currentTier: DunningTier;
  tierLabel: string;
  lastReminderSent: string;
  reminderChannel: 'ZALO_ZNS' | 'SMS' | 'APP_NOTIFICATION' | 'OFFICIAL_LETTER';
  escalatedToManager: boolean;
  notes?: string;
}

// Chức năng 12: Quản lý tạm ngừng & Khôi phục dịch vụ
export type SuspensionStatus = 'PROPOSED' | 'SUSPENDED' | 'RESTORED' | 'REJECTED';

export interface SuspensionCase {
  id: string;
  householdId: string;
  householdName: string;
  address: string;
  binId: string;
  totalDebt: number;
  overdueDays: number;
  status: SuspensionStatus;
  proposedDate: string;
  proposedBy: string;
  approvedDate?: string;
  approvedBy?: string;
  noticeSent: boolean; // Đã gửi thông báo niêm phong / ngừng gom rác
  traccarBlacklistSynced: boolean; // Đã đồng bộ loại khỏi lộ trình xe thu gom GPS
  restorationDate?: string;
  restorationReason?: string;
}

// Tab navigation
export type AdminTab = 
  | 'OVERVIEW'
  | 'BILLING_GEN'
  | 'AUTO_DEBIT'
  | 'RECONCILIATION'
  | 'DUNNING'
  | 'SUSPENSION';
