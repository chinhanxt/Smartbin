import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  Stack,
  CircularProgress,
} from '@mui/material';

export function CancelDialog({
  open,
  onClose,
  isPaid = false,
  onConfirmCancel,
  isLoading = false,
}) {
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (onConfirmCancel) {
      await onConfirmCancel(reason || 'Người dân yêu cầu hủy đơn');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Xác nhận hủy yêu cầu thu gom</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2">
            Bạn có chắc chắn muốn hủy đơn thu gom rác cồng kềnh này không?
          </Typography>

          {isPaid ? (
            <Alert severity="warning">
              <strong>Chính sách hoàn tiền:</strong> Nếu hủy trước thời điểm cắt dịch vụ (24 giờ
              trước ngày thu gom), khoản tiền đã thanh toán sẽ được tự động hoàn trả lại cho bạn.
            </Alert>
          ) : (
            <Alert severity="info">
              Đơn chưa thanh toán. Khi hủy, vị trí giữ chỗ xe gom và báo giá sẽ được giải phóng mà
              không phát sinh bất kỳ khoản phí nào.
            </Alert>
          )}

          <TextField
            label="Lý do hủy đơn"
            placeholder="Ví dụ: Đã tự xử lý xong, thay đổi kế hoạch dọn nhà..."
            multiline
            rows={3}
            fullWidth
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Giữ lại đơn
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Xác nhận hủy đơn
        </Button>
      </DialogActions>
    </Dialog>
  );
}
