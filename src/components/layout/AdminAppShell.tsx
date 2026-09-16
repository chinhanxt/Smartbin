import React, { useState } from 'react';
import { 
  BarChart3, 
  FileText, 
  CreditCard, 
  Scale, 
  BellRing, 
  UserX, 
  Building2, 
  Layers,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { AdminTab } from '../../types';

interface AdminAppShellProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  children: React.ReactNode;
}

export const AdminAppShell: React.FC<AdminAppShellProps> = ({
  currentTab,
  onSelectTab,
  children
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'OVERVIEW',
      label: 'Tổng quan điều hành',
      icon: <BarChart3 size={20} />,
    },
    {
      id: 'BILLING_GEN',
      label: 'Tạo hóa đơn định kỳ',
      icon: <FileText size={20} />,
    },
    {
      id: 'AUTO_DEBIT',
      label: 'Trích nợ tự động',
      icon: <CreditCard size={20} />,
    },
    {
      id: 'RECONCILIATION',
      label: 'Đối soát thanh toán',
      icon: <Scale size={20} />,
    },
    {
      id: 'DUNNING',
      label: 'Nhắc phí & Cảnh báo',
      icon: <BellRing size={20} />,
    },
    {
      id: 'SUSPENSION',
      label: 'Tạm ngừng dịch vụ',
      icon: <UserX size={20} />,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* SIDEBAR: Collapsible, clean width */}
      <aside 
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } flex-shrink-0 border-r border-border bg-card flex flex-col justify-between select-none transition-all duration-200`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-4 border-b border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#004b93] text-white font-black text-lg shadow-sm">
                <Layers size={22} />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="text-[16px] font-black tracking-tight text-[#004b93] leading-none truncate">
                    SmartBin Admin
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">
                    QUẢN TRỊ THU PHÍ
                  </div>
                </div>
              )}
            </div>

            {/* Collapse/Expand Toggle Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
              title={sidebarCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {/* Navigation Menu */}
          <div className="p-3">
            {!sidebarCollapsed && (
              <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                Quản trị thu phí
              </div>
            )}

            <nav className="space-y-1 mt-1">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center rounded-xl text-[13.5px] font-bold transition-all text-left ${
                      sidebarCollapsed
                        ? 'justify-center p-3'
                        : 'gap-3 px-3.5 py-3 whitespace-nowrap'
                    } ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'text-sidebar-foreground hover:bg-muted/70 hover:text-foreground'
                    }`}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-white' : 'text-primary'}`}>
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer Admin User Profile (No cross-app links) */}
        <div className="p-3 border-t border-border bg-slate-50/50">
          <div 
            className={`flex items-center rounded-xl bg-card border border-border ${
              sidebarCollapsed ? 'justify-center p-2' : 'gap-3 p-2.5'
            }`}
            title="Võ Văn Hậu • Kế toán trưởng • P. Hiệp Phú"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-black text-sm">
              VH
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="font-bold text-foreground text-xs truncate">Võ Văn Hậu</div>
                <div className="text-[10px] text-muted-foreground truncate">Kế toán trưởng • P. Hiệp Phú</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground truncate">
            <span>UBND TP. Thủ Đức</span>
            <span>/</span>
            <span className="font-bold text-foreground">Phường Hiệp Phú</span>
            <span>/</span>
            <span className="text-primary font-black uppercase">
              {navItems.find(i => i.id === currentTab)?.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
              <Building2 size={15} className="text-primary" />
              <span>Kỳ đối soát: Tháng 09/2026</span>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-inset ring-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Liên ngân hàng: OK</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
