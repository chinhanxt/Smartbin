import React from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Truck, 
  HeartPulse, 
  ShieldCheck, 
  ShieldAlert,
  AlertCircle, 
  Calendar, 
  Award,
  Building,
  CheckCircle2,
  FileCheck2
} from 'lucide-react';
import { EmployeeProfile } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';

interface MyProfileTabProps {
  employee: EmployeeProfile;
}

export const MyProfileTab: React.FC<MyProfileTabProps> = ({ employee }) => {
  const isDriver = employee.position === 'DRIVER';

  return (
    <div className="space-y-6">
      {/* Header Profile Banner */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#004b93] text-white font-black text-2xl shadow-sm">
              {employee.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                  {employee.fullName}
                </h1>
                <StatusBadge status={employee.status} />
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-sm text-muted-foreground mt-1">
                <span className="font-semibold text-[#004b93] bg-[#004b93]/10 px-2 py-0.5 rounded text-xs">
                  {employee.id}
                </span>
                <span>•</span>
                <span className="font-medium text-foreground">{employee.positionTitle}</span>
                <span>•</span>
                <span>{employee.department}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Phụ trách xe ép
              </span>
              <span className="font-mono font-bold text-base text-[#004b93]">
                {employee.assignedVehiclePlate || 'Theo phân công ca'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dossier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Định danh & Cá nhân */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <User size={18} className="text-[#004b93]" />
            <h3 className="font-bold text-base text-foreground">Định danh cá nhân</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Số CCCD / CMND:</span>
              <span className="font-mono font-bold text-foreground">{employee.nationalId}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Năm sinh:</span>
              <span className="font-medium text-foreground">{employee.birthYear} ({employee.gender})</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Số điện thoại:</span>
              <span className="font-bold text-[#004b93] flex items-center gap-1">
                <Phone size={14} />
                {employee.phone}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Email công vụ:</span>
              <span className="font-medium text-foreground truncate max-w-[170px]">{employee.email}</span>
            </div>
            <div className="py-1">
              <span className="text-muted-foreground block text-xs mb-1">Địa chỉ thường trú:</span>
              <span className="font-medium text-foreground text-xs leading-relaxed flex items-start gap-1">
                <MapPin size={14} className="shrink-0 mt-0.5 text-muted-foreground" />
                {employee.address}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Hợp đồng & Công tác */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Building size={18} className="text-[#004b93]" />
            <h3 className="font-bold text-base text-foreground">Hợp đồng & Vị trí</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Mã hồ sơ:</span>
              <span className="font-mono font-bold text-[#004b93]">{employee.id}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Loại hợp đồng:</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                {employee.contractType}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Ngày vào đơn vị:</span>
              <span className="font-medium text-foreground">{employee.joinDate}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Đội quản lý trực tiếp:</span>
              <span className="font-medium text-foreground">{employee.department}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Mức lương cơ bản:</span>
              <span className="font-bold text-base text-foreground">
                {employee.baseSalary.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Bằng lái xe & Chứng chỉ (hoặc Chứng chỉ vận hành) */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Award size={18} className="text-[#004b93]" />
            <h3 className="font-bold text-base text-foreground">
              {isDriver ? 'Giấy phép lái xe chuyên dụng' : 'Chứng chỉ chuyên môn'}
            </h3>
          </div>
          {isDriver && employee.driverLicense ? (
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 text-sm">
                    {employee.driverLicense.licenseClass}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    <CheckCircle2 size={12} />
                    Hợp lệ
                  </span>
                </div>
                <div className="text-xs text-amber-800 font-mono mt-1">
                  Số GPLX: {employee.driverLicense.licenseNumber}
                </div>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Ngày cấp GPLX:</span>
                <span className="font-medium text-foreground">{employee.driverLicense.issueDate}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Hạn kiểm định GPLX:</span>
                <span className="font-bold text-[#004b93]">{employee.driverLicense.expiryDate}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 text-sm">
                    Chứng chỉ ATVSLĐ Nhóm 3
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    <CheckCircle2 size={12} />
                    Hợp lệ
                  </span>
                </div>
                <div className="text-xs text-blue-800 mt-1">
                  Quy trình thu gom rác thải đô thị & vận hành bồn ép
                </div>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Thời hạn chứng chỉ:</span>
                <span className="font-medium text-foreground">2 năm (hạn 2027)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Cấp bởi:</span>
                <span className="font-medium text-foreground">Sở LĐ-TB&XH TP.HCM</span>
              </div>
            </div>
          )}
        </div>

        {/* Card 4: Sức khỏe lao động & BHLĐ */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <HeartPulse size={18} className="text-rose-600" />
            <h3 className="font-bold text-base text-foreground">Sức khỏe & Trang bị BHLĐ</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Tình trạng khám sức khỏe:</span>
              <span className="font-semibold text-emerald-700">{employee.healthCertStatus}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Khám định kỳ gần nhất:</span>
              <span className="font-medium text-foreground">{employee.healthCheckDate}</span>
            </div>
            <div className="py-1">
              <span className="text-muted-foreground block text-xs mb-1.5 font-semibold">
                Trang bị bảo hộ cá nhân (BHLĐ cấp phát):
              </span>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                  Ủng cao su chống đinh
                </span>
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                  Găng tay chống cắt
                </span>
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                  Áo phản quang ban đêm
                </span>
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                  Khẩu trang than hoạt tính
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Người liên hệ khẩn cấp */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <ShieldAlert size={18} className="text-amber-600" />
            <h3 className="font-bold text-base text-foreground">Liên hệ khẩn cấp</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg border border-border space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Họ và tên:</span>
                <span className="font-bold text-foreground">{employee.emergencyContact.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Mối quan hệ:</span>
                <span className="font-semibold text-[#004b93] bg-[#004b93]/10 px-2 py-0.5 rounded text-xs">
                  {employee.emergencyContact.relation}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Số điện thoại:</span>
                <a 
                  href={`tel:${employee.emergencyContact.phone.replace(/\s+/g, '')}`}
                  className="font-bold text-emerald-700 flex items-center gap-1 hover:underline"
                >
                  <Phone size={14} />
                  {employee.emergencyContact.phone}
                </a>
              </div>
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              Thông tin liên hệ ưu tiên khi có sự cố trên tuyến thu gom hoặc sự cố sức khỏe ngoài công trường.
            </div>
          </div>
        </div>

        {/* Card 6: Phụ cấp ngành đặc thù */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <FileCheck2 size={18} className="text-emerald-600" />
            <h3 className="font-bold text-base text-foreground">Chế độ phụ cấp ngành</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Phụ cấp độc hại vệ sinh:</span>
              <span className="font-bold text-foreground">
                +{employee.hazardAllowance.toLocaleString('vi-VN')} đ
              </span>
            </div>
            {employee.drivingAllowance > 0 && (
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Phụ cấp xe chuyên dụng:</span>
                <span className="font-bold text-foreground">
                  +{employee.drivingAllowance.toLocaleString('vi-VN')} đ
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Bảo hiểm Xã hội (10.5%):</span>
              <span className="font-medium text-emerald-700">Doanh nghiệp đóng đủ</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Khám sức khỏe:</span>
              <span className="font-medium text-foreground">2 lần / năm theo quy định</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
