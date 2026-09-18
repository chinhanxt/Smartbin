import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';

const AVAILABLE_DRIVERS = [
  { id: 'DRV-01', name: 'Nguyễn Văn An', status: 'AVAILABLE', shift: 'Ca sáng' },
  { id: 'DRV-02', name: 'Trần Đình Trọng', status: 'ASSIGNED', shift: 'Ca sáng' },
  { id: 'DRV-03', name: 'Phạm Minh Đức', status: 'AVAILABLE', shift: 'Ca sáng' },
  { id: 'DRV-04', name: 'Vũ Quốc Huy', status: 'AVAILABLE', shift: 'Ca chiều' },
  { id: 'DRV-05', name: 'Lê Văn Tài', status: 'ASSIGNED', shift: 'Ca sáng' },
];

const DriverAssignmentModal = ({ open, onClose, vehicleId, planVersion, onConfirmAssignment }) => {
  const [selectedDriverId, setSelectedDriverId] = useState('DRV-01');
  const [assignmentNote, setAssignmentNote] = useState('');

  const selectedDriver = AVAILABLE_DRIVERS.find((d) => d.id === selectedDriverId);
  const isDriverBusy = selectedDriver?.status === 'ASSIGNED';

  const handleConfirm = () => {
    if (isDriverBusy) {
      alert(
        'Tài xế này hiện đang phụ trách một nhiệm vụ khác. Vui lòng chọn tài xế đang sẵn sàng!',
      );
      return;
    }

    onConfirmAssignment({
      vehicleId,
      driverId: selectedDriver.id,
      driverName: `${selectedDriver.name} (${selectedDriver.shift})`,
      planVersion,
      note: assignmentNote,
      assignedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1, color: '#059669' }}>
        <AssignmentIndIcon />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Phân Công Tài Xế & Phương Tiện (Trang 03 PDF)
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Quy tắc Chống giao việc trùng: Một tài xế / xe chỉ chịu trách nhiệm tại một thời điểm. Mọi
          thay đổi phân công phải được gắn với phiên bản kế hoạch: <strong>{planVersion}</strong>.
        </Alert>

        <Box>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
            Phương tiện được giao:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a' }}>
            {vehicleId}
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: '#334155' }}>
            Chọn tài xế phụ trách:
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
          >
            {AVAILABLE_DRIVERS.map((driver) => (
              <MenuItem key={driver.id} value={driver.id}>
                {driver.name} ({driver.id}) • {driver.shift} • [
                {driver.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Đang bận'}]
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {isDriverBusy && (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            ⚠️ Tài xế {selectedDriver?.name} đang có nhiệm vụ thu gom trong ca. Bạn cần thu hồi
            nhiệm vụ cũ trước khi giao nhiệm vụ mới.
          </Alert>
        )}

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: '#334155' }}>
            Ghi chú điều phối:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            placeholder="Lưu ý về giờ xuất phát, chỉ dẫn ngõ cụt, hoặc thiết bị hỗ trợ..."
            value={assignmentNote}
            onChange={(e) => setAssignmentNote(e.target.value)}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Hủy bỏ
        </Button>
        <Button
          variant="contained"
          disabled={isDriverBusy}
          onClick={handleConfirm}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
            backgroundColor: '#059669',
            '&:hover': { backgroundColor: '#047857' },
          }}
        >
          Xác Nhận & Ban Hành Phân Công
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DriverAssignmentModal;
