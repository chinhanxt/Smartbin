import React, { useState } from 'react';
import { 
  Users, 
  CalendarClock, 
  Clock, 
  Banknote, 
  BarChart3, 
  UserCheck, 
  Truck, 
  FileText, 
  Layers, 
  PanelLeftClose, 
  PanelLeftOpen,
  ShieldCheck, 
  User, 
  LogOut,
  ChevronDown,
  Building2
} from 'lucide-react';
import { AuthUser, AdminHrmTab, EmployeePortalTab, EmployeeProfile } from '../../types';

interface HrmAppShellProps {
  currentUser: AuthUser;
  onLogout: () => void;
  adminTab: AdminHrmTab;
  onSelectAdminTab: (tab: AdminHrmTab) => void;
  employeeTab: EmployeePortalTab;
  onSelectEmployeeTab: (tab: EmployeePortalTab) => void;
  currentEmployee?: EmployeeProfile;
  allEmployees: EmployeeProfile[];
  onSelectCurrentEmployee?: (emp: EmployeeProfile) => void;
  children: React.ReactNode;
}

export const HrmAppShell: React.FC<HrmAppShellProps> = ({
  currentUser,
  onLogout,
  adminTab,
  onSelectAdminTab,
  employeeTab,
  onSelectEmployeeTab,
  currentEmployee,
  allEmployees,
  onSelectCurrentEmployee,
  children
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showEmployeeSwitcher, setShowEmployeeSwitcher] = useState(false);

  const currentRole = currentUser.role;

  const adminNavItems: { id: AdminHrmTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'OVERVIEW',
      label: 'Tổng quan nhân sự',
      icon: <BarChart3 size={20} />,
    },
    {
      id: 'EMPLOYEES',
      label: 'Hồ sơ nhân sự & Tài xế',
      icon: <Users size={20} />,
    },
    {
      id: 'SHIFTS',
      label: 'Phân ca & Tuyến gom',
      icon: <CalendarClock size={20} />,
    },
    {
      id: 'ATTENDANCE',
      label: 'Chấm công & Điểm danh',
      icon: <Clock size={20} />,
    },
    {
      id: 'PAYROLL',
      label: 'Bảng lương & Chế độ',
      icon: <Banknote size={20} />,
    },
  ];

  const employeeNavItems: { id: EmployeePortalTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'MY_PROFILE',
      label: 'Hồ sơ cá nhân',
      icon: <UserCheck size={20} />,
    },
    {
      id: 'MY_SHIFTS',
      label: 'Lịch ca & Tuyến xe',
      icon: <Truck size={20} />,
    },
    {
      id: 'MY_ATTENDANCE',
      label: 'Chấm công & Nghỉ phép',
      icon: <Clock size={20} />,
    },
    {
      id: 'MY_PAYSLIP',
      label: 'Phiếu lương của tôi',
      icon: <FileText size={20} />,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* SIDEBAR */}
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
                    SmartBin HRM
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">
                    {currentRole === 'ADMIN' ? 'Quản Trị Nhân Lực' : 'Portal Nhân Viên'}
                  </div>
                </div>
              )}
            </div>

            {/* Collapse/Expand Toggle Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition shrink-0"
              title={sidebarCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
              aria-label="Toggle sidebar"
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {/* Nav Items */}
          <div className="p-3">
            {!sidebarCollapsed && (
              <div className="px-3 pb-2 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
                {currentRole === 'ADMIN' ? 'Quản Lý Nhân Lực Đô Thị' : 'Không Gian Làm Việc'}
              </div>
            )}

            <nav className="space-y-1.5">
              {currentRole === 'ADMIN' ? (
                adminNavItems.map((item) => {
                  const isActive = adminTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectAdminTab(item.id)}
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
                })
              ) : (
                employeeNavItems.map((item) => {
                  const isActive = employeeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectEmployeeTab(item.id)}
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
                })
              )}
            </nav>
          </div>
        </div>

        {/* Footer Identity Block & Quick Logout */}
        <div className="p-3 border-t border-border bg-slate-50/50 space-y-2">
          {currentRole === 'ADMIN' ? (
            <div 
              className={`flex items-center rounded-xl bg-card border border-border ${
                sidebarCollapsed ? 'justify-center p-2' : 'gap-3 p-2.5'
              }`}
              title={`${currentUser.fullName} • ${currentUser.title}`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white font-black text-sm shadow-sm">
                {currentUser.avatarInitials}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-foreground text-xs truncate">{currentUser.fullName}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{currentUser.title}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <button 
                onClick={() => setShowEmployeeSwitcher(!showEmployeeSwitcher)}
                className={`w-full flex items-center rounded-xl bg-card border border-border hover:bg-muted/60 transition-colors ${
                  sidebarCollapsed ? 'justify-center p-2' : 'gap-3 p-2.5 text-left'
                }`}
                title={`${currentUser.fullName} (${currentUser.title})`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-sm shadow-sm">
                  {currentUser.avatarInitials}
                </div>
                {!sidebarCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-foreground text-xs truncate">{currentUser.fullName}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{currentUser.title}</div>
                  </div>
                )}
                {!sidebarCollapsed && <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
              </button>

              {/* Quick switch employee dropdown for testing */}
              {showEmployeeSwitcher && !sidebarCollapsed && onSelectCurrentEmployee && (
                <div className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-border bg-card p-1.5 shadow-xl z-50">
                  <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                    Chuyển tài khoản nhân sự:
                  </div>
                  {allEmployees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => {
                        onSelectCurrentEmployee(emp);
                        setShowEmployeeSwitcher(false);
                      }}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs font-semibold hover:bg-muted ${
                        currentEmployee?.id === emp.id ? 'bg-blue-50 text-primary font-bold' : 'text-foreground'
                      }`}
                    >
                      <span className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-[10px] font-black">
                        {emp.avatarInitials}
                      </span>
                      <div className="truncate min-w-0 flex-1">
                        <div className="truncate">{emp.fullName}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{emp.id} • {emp.positionTitle}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Logout Button in Sidebar */}
          {!sidebarCollapsed ? (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition border border-transparent hover:border-rose-200"
            >
              <LogOut size={14} />
              <span>Đăng xuất tài khoản</span>
            </button>
          ) : (
            <button
              onClick={onLogout}
              title="Đăng xuất tài khoản"
              className="w-full flex items-center justify-center p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between gap-4 flex-shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground truncate">
            <span>Xí Nghiệp Môi Trường Đô Thị</span>
            <span>/</span>
            <span className="font-bold text-foreground">Phường Hiệp Phú</span>
            <span>/</span>
            <span className="text-primary font-black uppercase">
              {currentRole === 'ADMIN' 
                ? adminNavItems.find(i => i.id === adminTab)?.label 
                : employeeNavItems.find(i => i.id === employeeTab)?.label}
            </span>
          </div>

          {/* Right Actions: Period */}
          <div className="flex items-center gap-3">
            {/* Active Period */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200/60">
              <Building2 size={15} className="text-primary" />
              <span>Kỳ công: Tháng 09/2026</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
