import React, { useState } from 'react';
import { AdminTab, Invoice, AutoDebitMandate, ReconciliationEntry, ReconciliationBatch, DunningRecord, SuspensionCase } from './types';
import { 
  initialInvoices, 
  initialMandates, 
  initialReconciliationEntries, 
  initialReconciliationBatch,
  initialDunningRecords, 
  initialSuspensionCases 
} from './mock/adminData';
import { AdminAppShell } from './components/layout/AdminAppShell';
import { BillingAdminOverview } from './components/tabs/BillingAdminOverview';
import { BillingGenerationTab } from './components/tabs/BillingGenerationTab';
import { AutoDebitManagementTab } from './components/tabs/AutoDebitManagementTab';
import { ReconciliationTab } from './components/tabs/ReconciliationTab';
import { DunningRemindersTab } from './components/tabs/DunningRemindersTab';
import { ServiceSuspensionTab } from './components/tabs/ServiceSuspensionTab';

export function App() {
  const [currentTab, setCurrentTab] = useState<AdminTab>('OVERVIEW');
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [mandates, setMandates] = useState<AutoDebitMandate[]>(initialMandates);
  const [reconciliationEntries, setReconciliationEntries] = useState<ReconciliationEntry[]>(initialReconciliationEntries);
  const [batch, setBatch] = useState<ReconciliationBatch>(initialReconciliationBatch);
  const [dunningRecords, setDunningRecords] = useState<DunningRecord[]>(initialDunningRecords);
  const [suspensionCases, setSuspensionCases] = useState<SuspensionCase[]>(initialSuspensionCases);

  // Chức năng 8: Tạo hóa đơn định kỳ hàng loạt
  const handleGenerateBatch = (cycle: string) => {
    const newInvoices: Invoice[] = [
      {
        id: `INV-202610-001`,
        householdId: 'HGD-TPTD-09218',
        householdName: 'Nguyễn Văn An',
        phone: '0908 123 456',
        address: 'Số 48/12 Đường Số 8, Khu Phố 3, P. Hiệp Phú',
        householdType: 'RESIDENTIAL',
        binId: 'BIN-IOT-7749',
        billingCycle: cycle,
        baseFee: 45000,
        overloadSurcharge: 0,
        environmentalFee: 5000,
        totalAmount: 50000,
        status: 'UNPAID',
        issuedDate: '01/10/2026',
        dueDate: '15/10/2026',
        paymentMethod: 'AUTO_DEBIT',
      },
      {
        id: `INV-202610-002`,
        householdId: 'HGD-TPTD-09219',
        householdName: 'Trần Thị Mai',
        phone: '0912 345 678',
        address: 'Số 50 Đường Số 8, Khu Phố 3, P. Hiệp Phú',
        householdType: 'RESIDENTIAL',
        binId: 'BIN-IOT-7750',
        billingCycle: cycle,
        baseFee: 45000,
        overloadSurcharge: 0,
        environmentalFee: 5000,
        totalAmount: 50000,
        status: 'UNPAID',
        issuedDate: '01/10/2026',
        dueDate: '15/10/2026',
        paymentMethod: 'VIETQR',
      },
    ];
    setInvoices(prev => [...newInvoices, ...prev]);
    alert(`Đã phát hành thành công gói hóa đơn định kỳ kỳ ${cycle}!`);
  };

  // Chức năng 9: Phát lệnh trích nợ tự động
  const handleTriggerBatchDebit = () => {
    setMandates(prev => prev.map(m => {
      if (m.status === 'ACTIVE') {
        return {
          ...m,
          lastDebitStatus: 'SUCCESS',
          lastDebitDate: '17/09/2026',
          lastAmount: 50000
        };
      }
      return m;
    }));
    // Gạch nợ cho các hóa đơn chưa nộp
    setInvoices(prev => prev.map(inv => {
      if (inv.paymentMethod === 'AUTO_DEBIT' && inv.status !== 'PAID') {
        return {
          ...inv,
          status: 'PAID',
          paidDate: '17/09/2026',
          transactionRef: `VCB-AUTO-${Math.floor(100000 + Math.random() * 900000)}`
        };
      }
      return inv;
    }));
  };

  // Thêm ủy quyền mới
  const handleAddMandate = (newMandate: Omit<AutoDebitMandate, 'id'>) => {
    const mandate: AutoDebitMandate = {
      ...newMandate,
      id: `AD-2026-00${mandates.length + 1}`
    };
    setMandates(prev => [mandate, ...prev]);
  };

  // Chức năng 10: Chạy đối soát thanh toán tự động
  const handleRunReconciliation = () => {
    setBatch(prev => ({
      ...prev,
      status: 'COMPLETED',
      matchedCount: prev.totalSystemInvoices,
      discrepancyCount: 0,
      reconciliationDate: '17/09/2026'
    }));
  };

  // Chức năng 11: Gửi nhắc nợ hàng loạt
  const handleSendBulkReminders = () => {
    setDunningRecords(prev => prev.map(r => ({
      ...r,
      lastReminderSent: '17/09/2026 (Zalo ZNS & SMS Tự động)'
    })));
  };

  // Chức năng 11 -> 12: Chuyển hồ sơ nợ quá hạn sang duyệt tạm ngừng
  const handleEscalateCase = (recordId: string) => {
    const record = dunningRecords.find(r => r.id === recordId);
    if (!record) return;

    setDunningRecords(prev => prev.map(r => r.id === recordId ? { ...r, escalatedToManager: true } : r));

    const newSuspensionCase: SuspensionCase = {
      id: `SUSP-2026-00${suspensionCases.length + 1}`,
      householdId: record.householdId,
      householdName: record.householdName,
      address: record.address,
      binId: `BIN-IOT-7799`,
      totalDebt: record.totalDebt,
      overdueDays: record.overdueDays,
      status: 'PROPOSED',
      proposedDate: '17/09/2026',
      proposedBy: 'Hệ thống tự động chuyển ngưỡng > 30 ngày',
      noticeSent: true,
      traccarBlacklistSynced: false,
    };
    setSuspensionCases(prev => [newSuspensionCase, ...prev]);
    alert(`Đã lập hồ sơ đề xuất tạm ngừng dịch vụ cho ${record.householdName}!`);
  };

  // Chức năng 12: Phê duyệt tạm ngừng dịch vụ (Đồng bộ GPS Traccar blacklist)
  const handleApproveSuspension = (caseId: string) => {
    setSuspensionCases(prev => prev.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          status: 'SUSPENDED',
          approvedDate: '17/09/2026',
          approvedBy: 'Võ Văn Hậu (Kế toán trưởng)',
          noticeSent: true,
          traccarBlacklistSynced: true, // Xe rác GPS Traccar tự động bỏ qua điểm này
        };
      }
      return c;
    }));
  };

  // Chức năng 12: Khôi phục dịch vụ thu gom rác
  const handleRestoreService = (caseId: string) => {
    setSuspensionCases(prev => prev.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          status: 'RESTORED',
          totalDebt: 0,
          overdueDays: 0,
          restorationDate: '17/09/2026',
          restorationReason: 'Đã hoàn thành nghĩa vụ nộp phí rác và phụ thu',
          traccarBlacklistSynced: false, // Kích hoạt lại trên xe rác GPS
        };
      }
      return c;
    }));
  };

  return (
    <AdminAppShell currentTab={currentTab} onSelectTab={setCurrentTab}>
      {currentTab === 'OVERVIEW' && (
        <BillingAdminOverview
          invoices={invoices}
          mandates={mandates}
          batch={batch}
          dunningRecords={dunningRecords}
          suspensionCases={suspensionCases}
          onNavigateTab={setCurrentTab}
        />
      )}

      {currentTab === 'BILLING_GEN' && (
        <BillingGenerationTab
          invoices={invoices}
          onGenerateBatch={handleGenerateBatch}
        />
      )}

      {currentTab === 'AUTO_DEBIT' && (
        <AutoDebitManagementTab
          mandates={mandates}
          onTriggerBatchDebit={handleTriggerBatchDebit}
          onAddMandate={handleAddMandate}
        />
      )}

      {currentTab === 'RECONCILIATION' && (
        <ReconciliationTab
          entries={reconciliationEntries}
          batch={batch}
          onRunReconciliation={handleRunReconciliation}
        />
      )}

      {currentTab === 'DUNNING' && (
        <DunningRemindersTab
          records={dunningRecords}
          onSendBulkReminders={handleSendBulkReminders}
          onEscalateCase={handleEscalateCase}
          onNavigateToSuspension={() => setCurrentTab('SUSPENSION')}
        />
      )}

      {currentTab === 'SUSPENSION' && (
        <ServiceSuspensionTab
          cases={suspensionCases}
          onApproveSuspension={handleApproveSuspension}
          onRestoreService={handleRestoreService}
        />
      )}
    </AdminAppShell>
  );
}

export default App;
