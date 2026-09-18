import React, { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { OverviewDashboard } from './components/tabs/OverviewDashboard';
import { HouseholdBindingTab } from './components/tabs/HouseholdBindingTab';
import { BinStatusTab } from './components/tabs/BinStatusTab';
import { CollectionScheduleTab } from './components/tabs/CollectionScheduleTab';
import { ComplaintsTab } from './components/tabs/ComplaintsTab';
import { BillingPaymentTab } from './components/tabs/BillingPaymentTab';
import { 
  MOCK_HOUSEHOLDS, 
  MOCK_BIN_TELEMETRY, 
  MOCK_COLLECTION_SCHEDULES, 
  MOCK_COMPLAINTS 
} from './mock/data';
import { HouseholdProfile, BinTelemetryData, CitizenComplaint } from './types';

export function App() {
  const [households, setHouseholds] = useState<HouseholdProfile[]>(MOCK_HOUSEHOLDS);
  const [currentHousehold, setCurrentHousehold] = useState<HouseholdProfile>(MOCK_HOUSEHOLDS[0]);
  const [currentTab, setCurrentTab] = useState<string>('overview');
  
  // Telemetry map
  const [telemetryMap, setTelemetryMap] = useState<Record<string, BinTelemetryData>>(MOCK_BIN_TELEMETRY);
  const currentBinId = currentHousehold.primaryBin.binId;
  const currentTelemetry = telemetryMap[currentBinId] || MOCK_BIN_TELEMETRY['bin-09218'];

  // Complaints
  const [complaints, setComplaints] = useState<CitizenComplaint[]>(MOCK_COMPLAINTS);

  // Update household binding
  const handleUpdateHousehold = (updated: HouseholdProfile) => {
    setHouseholds((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
    setCurrentHousehold(updated);
  };

  // Telemetry refresh (ping sensor)
  const handleRefreshTelemetry = () => {
    setTelemetryMap((prev) => {
      const existing = prev[currentBinId] || currentTelemetry;
      return {
        ...prev,
        [currentBinId]: {
          ...existing,
          lastUpdated: new Date().toISOString(),
          fillLevel: Math.min(100, existing.fillLevel + Math.floor(Math.random() * 3 - 1))
        }
      };
    });
  };

  // Adjust level in simulator
  const handleUpdateFillLevel = (newVal: number) => {
    setTelemetryMap((prev) => {
      const existing = prev[currentBinId] || currentTelemetry;
      return {
        ...prev,
        [currentBinId]: {
          ...existing,
          fillLevel: newVal,
          fillStatus: newVal >= 80 ? 'CRITICAL_FULL' : newVal >= 50 ? 'WARNING_HIGH' : 'NORMAL'
        }
      };
    });
  };

  // Submit new complaint
  const handleSubmitComplaint = (newTicket: CitizenComplaint) => {
    setComplaints((prev) => [newTicket, ...prev]);
  };

  // Rate resolved complaint
  const handleRateComplaint = (id: string, rating: number, comment: string) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, rating, feedbackComment: comment }
          : c
      )
    );
  };

  return (
    <AppShell
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      currentHousehold={currentHousehold}
      allHouseholds={households}
      onSelectHousehold={(hgd) => {
        setCurrentHousehold(hgd);
      }}
    >
      {currentTab === 'overview' && (
        <OverviewDashboard
          household={currentHousehold}
          telemetry={currentTelemetry}
          schedules={MOCK_COLLECTION_SCHEDULES}
          complaints={complaints}
          onNavigateTab={setCurrentTab}
        />
      )}

      {currentTab === 'household' && (
        <HouseholdBindingTab
          household={currentHousehold}
          onUpdateHousehold={handleUpdateHousehold}
        />
      )}

      {currentTab === 'telemetry' && (
        <BinStatusTab
          telemetry={currentTelemetry}
          deviceCode={currentHousehold.primaryBin.deviceCode}
          onRefreshTelemetry={handleRefreshTelemetry}
          onUpdateFillLevel={handleUpdateFillLevel}
        />
      )}

      {currentTab === 'schedule' && (
        <CollectionScheduleTab
          schedules={MOCK_COLLECTION_SCHEDULES}
          userAddress={currentHousehold.fullAddress}
        />
      )}

      {currentTab === 'complaints' && (
        <ComplaintsTab
          complaints={complaints}
          householdCode={currentHousehold.householdCode}
          binCode={currentHousehold.primaryBin.deviceCode}
          contactPhone={currentHousehold.phone}
          onSubmitComplaint={handleSubmitComplaint}
          onRateComplaint={handleRateComplaint}
        />
      )}

      {currentTab === 'billing' && (
        <BillingPaymentTab
          householdName={currentHousehold.headOfHousehold}
          householdId={currentHousehold.householdCode}
          userAddress={currentHousehold.ward + ', TP. Thủ Đức'}
        />
      )}
    </AppShell>
  );
}

export default App;
