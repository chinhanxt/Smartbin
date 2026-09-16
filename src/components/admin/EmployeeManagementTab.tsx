import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Truck, 
  Award, 
  HeartPulse, 
  Phone, 
  FileText, 
  CheckCircle2, 
  X, 
  Calendar, 
  MapPin, 
  AlertCircle 
} from 'lucide-react';
import { EmployeeProfile, EmployeePosition, EmploymentStatus } from '../../types';
import { formatVND } from '../../lib/utils';
import { StatusBadge } from '../shared/StatusBadge';

interface EmployeeManagementTabProps {
  employees: EmployeeProfile[];
  onAddEmployee: (newEmp: EmployeeProfile) => void;
}

export const EmployeeManagementTab: React.FC<EmployeeManagementTabProps> = ({
  employees,
  onAddEmployee
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New employee form state
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState<EmployeePosition>('DRIVER');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [birthYear, setBirthYear] = useState('1988');
  const [address, setAddress] = useState('');
  const [licenseClass, setLicenseClass] = useState('Hạng C (Xe tải > 3.5T)');
  const [licenseNum, setLicenseNum] = useState('');
  const [baseSalary, setBaseSalary] = useState('10500000');

  const filteredEmployees = employees.filter((emp) => {
    if (filterPosition !== 'ALL' && emp.position !== filterPosition) return false;
    if (filterStatus !== 'ALL' && emp.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        emp.fullName.toLowerCase().includes(q) ||
        emp.id.toLowerCase().includes(q) ||
        emp.phone.includes(q) ||
        emp.nationalId.includes(q)
      );
    }
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !nationalId) {
      alert('Vui lòng nhập đầy đủ họ tên, số điện thoại và CCCD');
      return;
    }

    const newEmpId = position === 'DRIVER' ? `DVR-${Math.floor(10000 + Math.random() * 90000)}` : `WRK-${Math.floor(10000 + Math.random() * 90000)}`;
    const initials = fullName.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase();

    const newEmp: EmployeeProfile = {
      id: newEmpId,
      fullName,
      avatarInitials: initials,
      position,
      positionTitle: position === 'DRIVER' ? 'Tài xế xe ép rác' : position === 'SANITATION_WORKER' ? 'Công nhân thu gom' : 'Kỹ thuật viên',
      department: 'Đội Vận Tải Cơ Giới 1',
      phone,
      email: `${fullName.toLowerCase().replace(/\s+/g, '')}@smartbin.gov.vn`,
      nationalId,
      birthYear: parseInt(birthYear, 10) || 1990,
      gender: 'Nam',
      address: address || 'P. Hiệp Phú, TP. Thủ Đức',
      joinDate: new Intl.DateTimeFormat('vi-VN').format(new Date()),
      contractType: 'Hợp đồng 3 năm',
      status: 'ACTIVE',
      assignedVehiclePlate: position === 'DRIVER' ? '59C-882.14' : undefined,
      driverLicense: position === 'DRIVER' ? {
        licenseNumber: licenseNum || '790123998811',
        licenseClass,
        issueDate: '01/01/2021',
        expiryDate: '01/01/2031',
        verified: true
      } : undefined,
      healthCertStatus: 'Sức khỏe Loại 1',
      healthCheckDate: new Intl.DateTimeFormat('vi-VN').format(new Date()),
      emergencyContact: {
        name: 'Gia đình',
        relation: 'Người thân',
        phone
      },
      baseSalary: parseInt(baseSalary, 10) || 9500000,
      hazardAllowance: 2000000,
      drivingAllowance: position === 'DRIVER' ? 1800000 : 0
    };

    onAddEmployee(newEmp);
    setShowAddModal(false);
    // Reset
    setFullName('');
    setPhone('');
    setNationalId('');
    setLicenseNum('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Hồ Sơ Nhân Sự & Tài Xế
          </h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/90 transition-all active:scale-95"
        >
          <Plus size={16} />
          <span>Thêm Nhân Sự Mới</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã NV, SĐT, CCCD..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-input bg-card pl-9 pr-3 py-2 text-xs font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">Tất cả chức danh</option>
              <option value="DRIVER">Tài xế xe ép rác</option>
              <option value="SANITATION_WORKER">Công nhân thu gom</option>
              <option value="DISPATCHER">Điều phối viên</option>
              <option value="MAINTENANCE">Kỹ thuật bảo trì</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">Mọi trạng thái</option>
              <option value="ACTIVE">Đang làm việc</option>
              <option value="ON_LEAVE">Nghỉ phép</option>
              <option value="STANDBY">Dự phòng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Directory Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-bold">
              <tr>
                <th className="px-3 py-2.5">Mã NV</th>
                <th className="px-3 py-2.5">Họ & Tên</th>
                <th className="px-3 py-2.5">Vị Trí & Tổ Đội</th>
                <th className="px-3 py-2.5">Điện Thoại / CCCD</th>
                <th className="px-3 py-2.5">Bằng Lái Xe Tải</th>
                <th className="px-3 py-2.5">Xe Phụ Trách</th>
                <th className="px-3 py-2.5">Trạng Thái</th>
                <th className="px-3 py-2.5 pr-4 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-bold text-primary whitespace-nowrap">
                    {emp.id}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                        {emp.avatarInitials}
                      </div>
                      <div className="font-bold text-foreground whitespace-nowrap">{emp.fullName}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="font-bold text-foreground">{emp.positionTitle}</div>
                    <div className="text-[10px] text-muted-foreground">{emp.department}</div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono">
                    <div className="font-semibold text-foreground">{emp.phone}</div>
                    <div className="text-[10px] text-muted-foreground">CCCD: {emp.nationalId}</div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {emp.driverLicense ? (
                      <div>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] ring-1 ring-emerald-200">
                          {emp.driverLicense.licenseClass.split('(')[0]}
                        </span>
                        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                          Hạn: {emp.driverLicense.expiryDate}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">Không yêu cầu</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-700 whitespace-nowrap">
                    {emp.assignedVehiclePlate || '--'}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <StatusBadge status={emp.status} />
                  </td>
                  <td className="px-3 py-2.5 pr-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedEmployee(emp)}
                      className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-primary hover:bg-muted transition-colors shadow-sm"
                    >
                      Hồ sơ chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Xem Hồ Sơ Chi Tiết (Full Employee Dossier) */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-sm">
                  {selectedEmployee.avatarInitials}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Hồ Sơ Nhân Viên: {selectedEmployee.fullName}
                  </h3>
                  <div className="text-xs text-muted-foreground font-mono">
                    {selectedEmployee.id} • {selectedEmployee.positionTitle}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Dossier */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Row 1: Thông tin định danh & CCCD */}
              <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileText size={14} className="text-primary" />
                  <span>Định Danh Pháp Lý & Cư Trú</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground block">Số CCCD / CMND:</span>
                    <strong className="font-mono text-foreground">{selectedEmployee.nationalId}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Năm sinh / Giới tính:</span>
                    <strong className="text-foreground">{selectedEmployee.birthYear} ({selectedEmployee.gender})</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Số điện thoại:</span>
                    <strong className="font-mono text-primary">{selectedEmployee.phone}</strong>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-muted-foreground block">Địa chỉ thường trú:</span>
                    <strong className="text-foreground">{selectedEmployee.address}</strong>
                  </div>
                </div>
              </div>

              {/* Row 2: Thẩm định Bằng Lái Xe Tải (Nếu là tài xế) */}
              {selectedEmployee.driverLicense && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Award size={15} className="text-emerald-700" />
                      Giấy Phép Lái Xe Chuyên Dùng
                    </span>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black ring-1 ring-emerald-300">
                      Đã Thẩm Định Hợp Lệ
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block">Hạng giấy phép:</span>
                      <strong className="text-emerald-900 font-bold">{selectedEmployee.driverLicense.licenseClass}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Số GPLX:</span>
                      <strong className="font-mono text-foreground">{selectedEmployee.driverLicense.licenseNumber}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Thời hạn sử dụng:</span>
                      <strong className="font-mono text-foreground">{selectedEmployee.driverLicense.expiryDate}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Row 3: Sức khỏe & Hợp đồng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-4 bg-card">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                    <HeartPulse size={14} className="text-rose-600" />
                    <span>Chứng Nhận Y Tế & Sức Khỏe</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-foreground">{selectedEmployee.healthCertStatus}</div>
                    <div className="text-muted-foreground">Khám định kỳ: {selectedEmployee.healthCheckDate}</div>
                    <div className="text-emerald-700 font-medium">Đủ điều kiện vận hành thu gom rác</div>
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4 bg-card">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                    <Truck size={14} className="text-primary" />
                    <span>Phương Tiện & Tổ Đội</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-foreground">
                      Xe ép rác: {selectedEmployee.assignedVehiclePlate || 'Chưa gắn cố định'}
                    </div>
                    <div className="text-muted-foreground">Tổ đội: {selectedEmployee.department}</div>
                    <div className="text-muted-foreground">Hợp đồng: {selectedEmployee.contractType}</div>
                  </div>
                </div>
              </div>

              {/* Row 4: Người liên hệ khẩn cấp & Lương */}
              <div className="rounded-xl border border-border p-4 bg-card flex flex-col sm:flex-row justify-between gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block">Liên hệ khẩn cấp khi gặp sự cố:</span>
                  <strong className="text-foreground">{selectedEmployee.emergencyContact.name} ({selectedEmployee.emergencyContact.relation})</strong>
                  <div className="font-mono text-primary font-bold mt-0.5">{selectedEmployee.emergencyContact.phone}</div>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block">Mức lương cơ bản:</span>
                  <strong className="text-base font-black text-foreground font-mono">{formatVND(selectedEmployee.baseSalary)}</strong>
                  <div className="text-muted-foreground text-[11px]">+ Phụ cấp độc hại & xe nặng</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-6 py-3 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-colors"
              >
                Đóng Hồ Sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Thêm Nhân Viên Mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-slate-50">
              <h3 className="text-base font-bold text-foreground">
                Thêm Hồ Sơ Nhân Sự / Tài Xế Mới
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Lê Văn Minh"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Vị trí đảm nhiệm</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as EmployeePosition)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-ring"
                  >
                    <option value="DRIVER">Tài xế xe ép rác</option>
                    <option value="SANITATION_WORKER">Công nhân thu gom rác</option>
                    <option value="DISPATCHER">Điều phối viên tuyến</option>
                    <option value="MAINTENANCE">Kỹ thuật viên bảo trì</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    placeholder="09xx xxx xxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Số CCCD *</label>
                  <input
                    type="text"
                    required
                    placeholder="12 chữ số"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-mono font-medium focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Năm sinh</label>
                  <input
                    type="number"
                    placeholder="1990"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Mức lương cơ bản (VNĐ)</label>
                  <input
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-mono font-medium focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-foreground block mb-1">Địa chỉ thường trú</label>
                  <input
                    type="text"
                    placeholder="Số nhà, đường, phường..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-ring"
                  />
                </div>

                {position === 'DRIVER' && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Hạng Bằng Lái Xe</label>
                      <select
                        value={licenseClass}
                        onChange={(e) => setLicenseClass(e.target.value)}
                        className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-ring"
                      >
                        <option value="Hạng C (Xe tải > 3.5T)">Hạng C (Xe tải &gt; 3.5T)</option>
                        <option value="Hạng FC (Xe đầu kéo)">Hạng FC (Xe đầu kéo &amp; xe ép lớn)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Số Giấy Phép Lái Xe</label>
                      <input
                        type="text"
                        placeholder="7901xxxxxxxx"
                        value={licenseNum}
                        onChange={(e) => setLicenseNum(e.target.value)}
                        className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-mono font-medium focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="border-t border-border pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 shadow-md"
                >
                  Lưu Hồ Sơ Nhân Sự
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
