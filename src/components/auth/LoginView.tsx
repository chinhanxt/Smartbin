import React, { useState } from 'react';
import { 
  ShieldCheck, 
  User, 
  Truck, 
  Lock, 
  Layers, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound,
  Building2,
  Users
} from 'lucide-react';
import { AuthUser, EmployeeProfile, UserRole } from '../../types';

interface LoginViewProps {
  employees: EmployeeProfile[];
  onLogin: (user: AuthUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ employees, onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  
  // Admin form state
  const [adminUsername, setAdminUsername] = useState('admin_hr');
  const [adminPassword, setAdminPassword] = useState('123456');

  // Employee form state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    employees[0]?.id || 'DVR-09201'
  );
  const [employeePin, setEmployeePin] = useState('123456');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername || !adminPassword) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu quản trị.');
      return;
    }

    // Authenticate Admin
    const adminUser: AuthUser = {
      role: 'ADMIN',
      username: adminUsername,
      fullName: 'Phan Minh Hoàng',
      avatarInitials: 'PM',
      title: 'Trưởng Phòng Nhân Sự HR'
    };

    onLogin(adminUser);
  };

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) {
      setErrorMessage('Không tìm thấy thông tin nhân sự.');
      return;
    }

    if (!employeePin) {
      setErrorMessage('Vui lòng nhập mã PIN bảo mật cá nhân.');
      return;
    }

    // Authenticate Employee
    const empUser: AuthUser = {
      role: 'EMPLOYEE',
      username: emp.id.toLowerCase(),
      fullName: emp.fullName,
      avatarInitials: emp.avatarInitials,
      title: emp.positionTitle,
      employeeProfile: emp
    };

    onLogin(empUser);
  };

  const handleQuickEmployeeLogin = (emp: EmployeeProfile) => {
    setSelectedEmployeeId(emp.id);
    const empUser: AuthUser = {
      role: 'EMPLOYEE',
      username: emp.id.toLowerCase(),
      fullName: emp.fullName,
      avatarInitials: emp.avatarInitials,
      title: emp.positionTitle,
      employeeProfile: emp
    };
    onLogin(empUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between select-none">
      {/* Top Brand Header */}
      <header className="h-16 px-6 sm:px-10 border-b border-border bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#004b93] text-white font-black text-lg shadow-sm">
            <Layers size={22} />
          </div>
          <div>
            <div className="text-[17px] font-black tracking-tight text-[#004b93] leading-none">
              SmartBin HRM
            </div>
            <div className="text-[11px] font-semibold text-muted-foreground mt-0.5">
              Xí Nghiệp Môi Trường Đô Thị TP. Thủ Đức
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Building2 size={14} className="text-[#004b93]" />
          <span>Hệ Thống Xác Thực Tập Trung</span>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Card Title */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Đăng Nhập Hệ Thống
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Cổng quản lý nhân lực, điều phối xe ép rác & tra cứu lương thưởng
            </p>
          </div>

          {/* Role Choice Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('ADMIN');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-black transition-all ${
                selectedRole === 'ADMIN'
                  ? 'bg-[#004b93] text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShieldCheck size={16} />
              <span>Quản Trị Viên (Admin)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('EMPLOYEE');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-black transition-all ${
                selectedRole === 'EMPLOYEE'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User size={16} />
              <span>Nhân Viên / Tài Xế</span>
            </button>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ADMIN LOGIN FORM */}
          {selectedRole === 'ADMIN' ? (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Tài khoản Quản trị
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="admin_hr"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-[#004b93]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-[#004b93]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-[#004b93] text-white font-bold text-sm shadow-md hover:bg-[#003870] active:scale-[0.99] transition flex items-center justify-center gap-2"
              >
                <span>Đăng Nhập Quản Trị</span>
                <ArrowRight size={16} />
              </button>

              {/* Demo Quick login hint */}
              <div className="pt-2 border-t border-border">
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-blue-900 font-bold">
                    <span className="flex items-center gap-1">
                      <KeyRound size={14} />
                      Tài khoản Quản trị Demo:
                    </span>
                    <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-[11px]">admin_hr / 123456</span>
                  </div>
                  <div className="text-[11px] text-blue-800">
                    Quyền hạn: Toàn quyền quản lý hồ sơ nhân sự, phân ca trực, chấm công GPS & bảng lương.
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* EMPLOYEE / DRIVER LOGIN FORM */
            <form onSubmit={handleEmployeeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Chọn Hồ Sơ Nhân Sự / Tài Xế
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.id}) — {emp.positionTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Mã PIN xác thực cá nhân
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <KeyRound size={16} />
                  </div>
                  <input
                    type="password"
                    value={employeePin}
                    onChange={(e) => setEmployeePin(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 active:scale-[0.99] transition flex items-center justify-center gap-2"
              >
                <span>Vào Không Gian Cá Nhân</span>
                <ArrowRight size={16} />
              </button>

              {/* Danh sách 1-click chọn nhanh cho demo */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Hoặc đăng nhập nhanh bằng 1 chạm:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {employees.slice(0, 4).map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => handleQuickEmployeeLogin(emp)}
                      className="p-2.5 rounded-xl border border-border bg-slate-50 hover:bg-emerald-50/70 hover:border-emerald-300 text-left transition flex items-center gap-2.5 group"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs group-hover:bg-emerald-600 group-hover:text-white transition">
                        {emp.avatarInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-foreground truncate group-hover:text-emerald-900">
                          {emp.fullName}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {emp.position === 'DRIVER' ? 'Tài xế' : 'Công nhân'} • {emp.id}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-border bg-white text-center text-xs text-muted-foreground">
        Hệ thống phân quyền SmartBin HRM • Xí nghiệp Môi trường Đô thị TP. Thủ Đức
      </footer>
    </div>
  );
};
