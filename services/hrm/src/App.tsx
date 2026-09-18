import React, { useState } from 'react';
import { 
  AuthUser,
  UserRole, 
  AdminHrmTab, 
  EmployeePortalTab, 
  EmployeeProfile, 
  ShiftSchedule, 
  AttendanceRecord, 
  LeaveRequest, 
  MonthlyPayroll 
} from './types';
import { 
  MOCK_EMPLOYEES, 
  MOCK_SHIFTS, 
  MOCK_ATTENDANCE, 
  MOCK_LEAVE_REQUESTS, 
  MOCK_PAYROLL 
} from './mock/hrmData';
import { HrmAppShell } from './components/layout/HrmAppShell';
import { LoginView } from './components/auth/LoginView';

// Admin Tabs
import { HrmOverviewTab } from './components/admin/HrmOverviewTab';
import { EmployeeManagementTab } from './components/admin/EmployeeManagementTab';
import { ShiftSchedulingTab } from './components/admin/ShiftSchedulingTab';
import { AttendanceAdminTab } from './components/admin/AttendanceAdminTab';
import { PayrollAdminTab } from './components/admin/PayrollAdminTab';

// Employee Portal Tabs
import { MyProfileTab } from './components/employee/MyProfileTab';
import { MyShiftsTab } from './components/employee/MyShiftsTab';
import { MyAttendanceTab } from './components/employee/MyAttendanceTab';
import { MyPayslipTab } from './components/employee/MyPayslipTab';

export const App: React.FC = () => {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('smartbin_hrm_auth');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default logged-in as Admin for initial launch demonstration
    return {
      role: 'ADMIN',
      username: 'admin_hr',
      fullName: 'Phan Minh Hoàng',
      avatarInitials: 'PM',
      title: 'Trưởng Phòng Nhân Sự HR'
    };
  });

  const [adminTab, setAdminTab] = useState<AdminHrmTab>('OVERVIEW');
  const [employeeTab, setEmployeeTab] = useState<EmployeePortalTab>('MY_PROFILE');
  
  // Data state
  const [employees, setEmployees] = useState<EmployeeProfile[]>(MOCK_EMPLOYEES);
  const [shifts, setShifts] = useState<ShiftSchedule[]>(MOCK_SHIFTS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(MOCK_LEAVE_REQUESTS);
  const [payroll, setPayroll] = useState<MonthlyPayroll[]>(MOCK_PAYROLL);

  // Active employee for Employee Portal view
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeProfile>(() => {
    if (currentUser?.employeeProfile) {
      return currentUser.employeeProfile;
    }
    return MOCK_EMPLOYEES[0];
  });

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem('smartbin_hrm_auth', JSON.stringify(user));
    if (user.role === 'EMPLOYEE' && user.employeeProfile) {
      setCurrentEmployee(user.employeeProfile);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('smartbin_hrm_auth');
  };

  const handleSelectCurrentEmployee = (emp: EmployeeProfile) => {
    setCurrentEmployee(emp);
    const updatedUser: AuthUser = {
      role: 'EMPLOYEE',
      username: emp.id.toLowerCase(),
      fullName: emp.fullName,
      avatarInitials: emp.avatarInitials,
      title: emp.positionTitle,
      employeeProfile: emp
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('smartbin_hrm_auth', JSON.stringify(updatedUser));
  };

  // Handlers for Admin
  const handleAddEmployee = (newEmp: EmployeeProfile) => {
    setEmployees((prev) => [newEmp, ...prev]);
  };

  const handleAddShift = (newShift: ShiftSchedule) => {
    setShifts((prev) => [newShift, ...prev]);
  };

  const handleApproveLeave = (id: string) => {
    setLeaveRequests((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'APPROVED' } : l))
    );
  };

  const handleRejectLeave = (id: string) => {
    setLeaveRequests((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'REJECTED' } : l))
    );
  };

  const handleApproveAllPayroll = () => {
    setPayroll((prev) =>
      prev.map((p) => ({ ...p, status: 'APPROVED', payDate: '05/10/2026' }))
    );
  };

  // Handlers for Employee
  const handleSubmitLeaveRequest = (newLeave: LeaveRequest) => {
    setLeaveRequests((prev) => [newLeave, ...prev]);
  };

  const handlePunchIn = (shiftId: string) => {
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const todayStr = '17/09/2026';
    
    // Update shift
    setShifts((prev) =>
      prev.map((s) => (s.id === shiftId ? { ...s, checkInTime: timeStr, status: 'IN_PROGRESS' } : s))
    );

    // Add attendance record
    const newRecord: AttendanceRecord = {
      id: `ATT-${Date.now().toString().slice(-6)}`,
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.fullName,
      date: todayStr,
      shiftName: 'Ca Sáng (04:30 - 11:30)',
      checkIn: timeStr,
      checkOut: '--:--',
      workHours: 7,
      overtimeHours: 0,
      status: 'ON_TIME',
      gpsLocation: 'Bãi xe Xí nghiệp Môi Trường TP. Thủ Đức'
    };

    setAttendance((prev) => [newRecord, ...prev]);
  };

  // If not authenticated, render Login Screen
  if (!currentUser) {
    return <LoginView employees={employees} onLogin={handleLogin} />;
  }

  return (
    <HrmAppShell
      currentUser={currentUser}
      onLogout={handleLogout}
      adminTab={adminTab}
      onSelectAdminTab={setAdminTab}
      employeeTab={employeeTab}
      onSelectEmployeeTab={setEmployeeTab}
      currentEmployee={currentEmployee}
      allEmployees={employees}
      onSelectCurrentEmployee={handleSelectCurrentEmployee}
    >
      {currentUser.role === 'ADMIN' ? (
        <>
          {adminTab === 'OVERVIEW' && (
            <HrmOverviewTab
              employees={employees}
              shifts={shifts}
              attendance={attendance}
              payroll={payroll}
              leaveRequests={leaveRequests}
              onNavigateTab={setAdminTab}
            />
          )}

          {adminTab === 'EMPLOYEES' && (
            <EmployeeManagementTab
              employees={employees}
              onAddEmployee={handleAddEmployee}
            />
          )}

          {adminTab === 'SHIFTS' && (
            <ShiftSchedulingTab
              shifts={shifts}
              employees={employees}
              onAddShift={handleAddShift}
            />
          )}

          {adminTab === 'ATTENDANCE' && (
            <AttendanceAdminTab
              attendance={attendance}
              leaveRequests={leaveRequests}
              onApproveLeave={handleApproveLeave}
              onRejectLeave={handleRejectLeave}
            />
          )}

          {adminTab === 'PAYROLL' && (
            <PayrollAdminTab
              payroll={payroll}
              onApproveAll={handleApproveAllPayroll}
            />
          )}
        </>
      ) : (
        <>
          {employeeTab === 'MY_PROFILE' && (
            <MyProfileTab employee={currentEmployee} />
          )}

          {employeeTab === 'MY_SHIFTS' && (
            <MyShiftsTab
              employee={currentEmployee}
              shifts={shifts}
              onPunchIn={handlePunchIn}
            />
          )}

          {employeeTab === 'MY_ATTENDANCE' && (
            <MyAttendanceTab
              employee={currentEmployee}
              attendanceRecords={attendance}
              leaveRequests={leaveRequests}
              onSubmitLeaveRequest={handleSubmitLeaveRequest}
            />
          )}

          {employeeTab === 'MY_PAYSLIP' && (
            <MyPayslipTab
              employee={currentEmployee}
              payrolls={payroll}
            />
          )}
        </>
      )}
    </HrmAppShell>
  );
};

export default App;
