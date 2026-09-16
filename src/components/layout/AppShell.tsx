import React, { useState } from 'react';
import { 
  Users, 
  Trash2, 
  Calendar, 
  MessageSquareWarning, 
  LayoutDashboard, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Bell, 
  ChevronDown,
  Building2,
  ShieldCheck,
  Radio,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { HouseholdProfile } from '../../types';

interface AppShellProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  currentHousehold: HouseholdProfile;
  allHouseholds: HouseholdProfile[];
  onSelectHousehold: (hgd: HouseholdProfile) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onTabChange,
  currentHousehold,
  allHouseholds,
  onSelectHousehold,
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showHouseholdMenu, setShowHouseholdMenu] = useState(false);

  const navItems = [
    {
      id: 'overview',
      label: 'Tổng quan dịch vụ',
      icon: LayoutDashboard,
    },
    {
      id: 'household',
      label: 'Hộ dân & Thùng rác',
      icon: Users,
    },
    {
      id: 'telemetry',
      label: 'Tình trạng thùng rác',
      icon: Trash2,
    },
    {
      id: 'schedule',
      label: 'Lịch thu gom & GPS',
      icon: Calendar,
    },
    {
      id: 'complaints',
      label: 'Gửi phản ánh',
      icon: MessageSquareWarning,
    },
    {
      id: 'billing',
      label: 'Hóa đơn & Nộp phí',
      icon: CreditCard,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* SIDEBAR: Wider width (w-72) to eliminate truncation completely */}
      <aside
        className={cn(
          'relative flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out select-none shrink-0',
          sidebarOpen ? 'w-72' : 'w-16'
        )}
      >
        {/* Header logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Trash2 size={22} />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col whitespace-nowrap">
                <span className="text-lg font-bold text-[#004b93] tracking-tight">
                  Smartbin Cư Dân
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Dịch vụ rác thông minh
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
            title={sidebarOpen ? 'Thu gọn thanh điều hướng' : 'Mở rộng thanh điều hướng'}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        {/* Navigation list: clear text, no truncation, no crowded badge pills */}
        <nav className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto p-3">
          {sidebarOpen && (
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Danh mục quản lý
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'group flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-[15px] font-semibold transition-all text-left whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon 
                  size={22} 
                  className={cn(
                    'shrink-0 transition-colors', 
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  )} 
                />
                
                {sidebarOpen && (
                  <span className="leading-none">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Household Profile */}
        <div className="border-t border-border p-3 bg-muted/40">
          <div className="relative">
            <button
              onClick={() => setShowHouseholdMenu(!showHouseholdMenu)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-sidebar-accent text-left",
                showHouseholdMenu && "bg-sidebar-accent"
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-sm">
                {currentHousehold.headOfHousehold.charAt(0)}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-foreground truncate">
                      {currentHousehold.headOfHousehold}
                    </span>
                    <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {currentHousehold.householdCode}
                  </div>
                </div>
              )}
              {sidebarOpen && <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
            </button>

            {/* Switch Household Dropdown */}
            {showHouseholdMenu && sidebarOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-border bg-card p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                  Chọn Hộ Gia Đình
                </div>
                {allHouseholds.map((hgd) => (
                  <button
                    key={hgd.id}
                    onClick={() => {
                      onSelectHousehold(hgd);
                      setShowHouseholdMenu(false);
                    }}
                    className={cn(
                      "w-full flex flex-col items-start px-3 py-2 rounded-lg text-xs transition-colors text-left",
                      hgd.id === currentHousehold.id
                        ? "bg-primary/10 text-primary font-bold"
                        : "hover:bg-muted text-foreground font-medium"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-semibold">{hgd.headOfHousehold}</span>
                      <span className="font-mono text-xs text-muted-foreground">{hgd.householdCode}</span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate w-full mt-0.5">
                      {hgd.ward}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Top Navbar: Compact, no-wrap, concise badges */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-sm text-muted-foreground font-medium">Smartbin</span>
            <span className="text-sm text-muted-foreground font-bold">›</span>
            <span className="text-base font-bold text-foreground">
              {navItems.find((n) => n.id === currentTab)?.label || 'Bảng điều khiển'}
            </span>
          </div>

          <div className="flex items-center gap-3 whitespace-nowrap">
            {/* Live Indicator */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LoRaWAN Online</span>
            </div>

            {/* Address Chip */}
            <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground font-medium">
              <Building2 size={14} className="text-primary shrink-0" />
              <span>{currentHousehold.ward}, TP. Thủ Đức</span>
            </div>

            {/* Notification Bell */}
            <button 
              onClick={() => onTabChange('complaints')}
              className="relative rounded-lg border border-border bg-background p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Xem phản ánh"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-destructive" />
            </button>
          </div>
        </header>

        {/* Viewport Outlet */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-6 py-6 max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
