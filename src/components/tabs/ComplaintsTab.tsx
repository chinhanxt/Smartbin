import React, { useState } from 'react';
import { 
  MessageSquareWarning, 
  Send, 
  Camera, 
  CheckCircle2, 
  Clock, 
  Image as ImageIcon, 
  Star, 
  UserCheck, 
  PlusCircle
} from 'lucide-react';
import { CitizenComplaint, ComplaintCategory } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';

interface ComplaintsTabProps {
  complaints: CitizenComplaint[];
  householdCode: string;
  binCode: string;
  contactPhone: string;
  onSubmitComplaint: (newComplaint: CitizenComplaint) => void;
  onRateComplaint: (id: string, rating: number, comment: string) => void;
}

export const ComplaintsTab: React.FC<ComplaintsTabProps> = ({
  complaints,
  householdCode,
  binCode,
  contactPhone,
  onSubmitComplaint,
  onRateComplaint
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form states
  const [category, setCategory] = useState<ComplaintCategory>('MISSED_COLLECTION');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Rating modal states
  const [ratingComplaintId, setRatingComplaintId] = useState<string | null>(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const categoryLabels: Record<ComplaintCategory, string> = {
      MISSED_COLLECTION: 'Bỏ sót thu gom',
      INCOMPLETE_COLLECTION: 'Chưa thu sạch / Rơi vãi',
      DAMAGED_BIN: 'Thùng rác hỏng',
      SCHEDULE_VIOLATION: 'Sai khung giờ gom',
      ODOR_LEAKAGE: 'Mùi hôi rò rỉ',
      OTHER: 'Vấn đề khác'
    };

    const newTicket: CitizenComplaint = {
      id: `pa-${Date.now()}`,
      complaintCode: `PA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      categoryLabel: categoryLabels[category],
      title: title.trim(),
      description: description.trim(),
      householdCode,
      binCode,
      contactPhone,
      createdAt: new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short'
      }).format(new Date()),
      updatedAt: 'Vừa xong',
      status: 'RECEIVED',
      priority: 'HIGH',
      attachedImages: imageUrl ? [imageUrl] : [
        'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&auto=format&fit=crop&q=60'
      ]
    };

    onSubmitComplaint(newTicket);
    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setSuccessToast(`Đã gửi phản ánh thành công! Mã tiếp nhận: ${newTicket.complaintCode}.`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleConfirmRating = () => {
    if (ratingComplaintId) {
      onRateComplaint(ratingComplaintId, ratingVal, feedbackText);
      setRatingComplaintId(null);
      setFeedbackText('');
    }
  };

  const filtered = complaints.filter((c) => {
    if (filterStatus === 'ACTIVE') return c.status !== 'RESOLVED' && c.status !== 'REJECTED';
    if (filterStatus === 'RESOLVED') return c.status === 'RESOLVED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header: Concise and clean */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Gửi & Theo Dõi Phản Ánh
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Báo bỏ sót rác, rơi vãi hoặc hư hỏng thiết bị để đối soát xử lý.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 shadow-sm whitespace-nowrap"
        >
          <PlusCircle size={18} />
          Gửi Phản Ánh Mới
        </button>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 text-sm font-bold whitespace-nowrap">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Tất Cả ({complaints.length})
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'ACTIVE'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Đang Xử Lý ({complaints.filter((c) => c.status !== 'RESOLVED').length})
          </button>
          <button
            onClick={() => setFilterStatus('RESOLVED')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'RESOLVED'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Đã Giải Quyết ({complaints.filter((c) => c.status === 'RESOLVED').length})
          </button>
        </div>

        <span className="text-xs font-semibold text-muted-foreground hidden sm:block whitespace-nowrap">
          Cam kết xử lý trong 2-4 giờ
        </span>
      </div>

      {/* Complaints List Cards */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div 
            key={item.id} 
            className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow"
          >
            {/* Top row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5">
              <div className="flex items-center gap-3 whitespace-nowrap">
                <span className="font-mono text-base font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
                  {item.complaintCode}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-muted text-foreground">
                  {item.categoryLabel}
                </span>
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Clock size={12} /> {item.createdAt}
                </span>
              </div>

              <StatusBadge status={item.status} />
            </div>

            {/* Main content */}
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-foreground">
                {item.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Attached Photos */}
            {item.attachedImages && item.attachedImages.length > 0 && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <ImageIcon size={14} /> Ảnh đính kèm:
                </span>
                <div className="flex gap-2">
                  {item.attachedImages.map((img, i) => (
                    <a key={i} href={img} target="_blank" rel="noreferrer" className="block relative group">
                      <img 
                        src={img} 
                        alt="Ảnh phản ánh" 
                        className="h-14 w-20 rounded-xl object-cover border border-border group-hover:opacity-85 transition-opacity" 
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 4-Step Resolution Timeline Bar: Big, clear, readable */}
            <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-3">
              <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">
                Tiến Trình Xử Lý Minh Bạch
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm font-semibold">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  <span>1. Tiếp nhận</span>
                </div>

                <div className={`flex items-center gap-2 p-2.5 rounded-lg border whitespace-nowrap ${
                  item.status !== 'RECEIVED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-muted text-muted-foreground border-border'
                }`}>
                  <CheckCircle2 size={16} className={`shrink-0 ${item.status !== 'RECEIVED' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                  <span>2. Kiểm tra GPS</span>
                </div>

                <div className={`flex items-center gap-2 p-2.5 rounded-lg border whitespace-nowrap ${
                  item.status === 'DISPATCHED_RESOLVE' || item.status === 'RESOLVED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-muted text-muted-foreground border-border'
                }`}>
                  <CheckCircle2 size={16} className={`shrink-0 ${item.status === 'DISPATCHED_RESOLVE' || item.status === 'RESOLVED' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                  <span>3. Điều xe xử lý</span>
                </div>

                <div className={`flex items-center gap-2 p-2.5 rounded-lg border whitespace-nowrap ${
                  item.status === 'RESOLVED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-muted text-muted-foreground border-border'
                }`}>
                  <CheckCircle2 size={16} className={`shrink-0 ${item.status === 'RESOLVED' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                  <span>4. Nghiệm thu xong</span>
                </div>
              </div>

              {/* Inspector note response */}
              {item.inspectorNotes && (
                <div className="mt-2 text-xs border-t border-border pt-2 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <UserCheck size={15} className="text-primary" />
                    <span>Phản hồi từ {item.inspectorName || 'Thanh tra'}:</span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-relaxed pl-5 bg-background p-2 rounded-lg border border-border">
                    "{item.inspectorNotes}"
                  </p>
                </div>
              )}
            </div>

            {/* Footer / Rating Section */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border text-xs">
              <div className="text-muted-foreground font-medium">
                Cập nhật: <strong className="text-foreground">{item.updatedAt}</strong>
              </div>

              {item.status === 'RESOLVED' && (
                <div className="flex items-center gap-3">
                  {item.rating ? (
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                      <Star size={16} fill="currentColor" />
                      <span>{item.rating}/5 sao</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setRatingComplaintId(item.id);
                        setRatingVal(5);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 font-bold text-foreground hover:bg-accent whitespace-nowrap"
                    >
                      <Star size={14} className="text-amber-500" /> Đánh Giá Dịch Vụ
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE COMPLAINT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageSquareWarning size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-card-foreground">
                  Gửi Phản Ánh Dịch Vụ Rác
                </h3>
                <p className="text-xs text-muted-foreground">
                  Thông tin được đối soát trực tiếp với hành trình xe GPS
                </p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Loại Phản Ánh *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                  className="form-input font-semibold"
                >
                  <option value="MISSED_COLLECTION">Bỏ sót thu gom rác</option>
                  <option value="INCOMPLETE_COLLECTION">Chưa thu sạch / Rơi vãi nước rỉ rác</option>
                  <option value="DAMAGED_BIN">Thùng rác bị hỏng / Nắp servo lỗi</option>
                  <option value="SCHEDULE_VIOLATION">Thu gom sai khung giờ quy định</option>
                  <option value="ODOR_LEAKAGE">Mùi hôi bốc lên từ nắp thùng</option>
                  <option value="OTHER">Vấn đề khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Tiêu Đề Tóm Tắt *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Xe không vào ngõ 48 lấy rác"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Nội Dung Chi Tiết *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Mô tả cụ thể thời gian, vị trí..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input h-auto resize-none py-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1 flex items-center justify-between">
                  <span>Ảnh Hiện Trường</span>
                  <button
                    type="button"
                    onClick={() => setImageUrl('https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500')}
                    className="text-primary text-xs font-bold hover:underline"
                  >
                    + Thêm Ảnh Mẫu
                  </button>
                </label>
                <input
                  type="url"
                  placeholder="Dán link ảnh hoặc bấm Thêm Ảnh Mẫu"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="form-input font-mono text-xs"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground hover:bg-accent"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-sm"
                >
                  <Send size={15} /> Gửi Phản Ánh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RATING MODAL */}
      {ratingComplaintId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setRatingComplaintId(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-card-foreground">
              Đánh Giá Chất Lượng Phục Vụ
            </h3>

            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRatingVal(s)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star 
                    size={30} 
                    className={s <= ratingVal ? 'text-amber-500 fill-amber-500' : 'text-slate-300'} 
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              placeholder="Nhận xét (không bắt buộc)..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="form-input h-auto resize-none text-xs"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRatingComplaintId(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground hover:bg-accent"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmRating}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                Gửi Đánh Giá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
