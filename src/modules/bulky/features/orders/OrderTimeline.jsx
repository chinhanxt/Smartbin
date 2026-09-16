import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';

const EVENT_LABELS = {
  DRAFT_CREATED: 'Khởi tạo bản nháp yêu cầu',
  DRAFT_UPDATED: 'Cập nhật bản nháp',
  ITEMS_CONFIRMED: 'Xác nhận danh mục đồ cồng kềnh',
  QUOTE_AND_HOLD_RESERVED: 'Nhận báo giá và giữ chỗ',
  ORDER_CONFIRMED_PAID: 'Thanh toán thành công & Lên lịch xe gom',
  ORDER_CANCELLED: 'Đã hủy đơn thu gom',
  LATE_PAYMENT_RECEIVED: 'Nhận thanh toán muộn (Cần xác nhận lịch)',
  PAYMENT_FAILED: 'Thanh toán thất bại',
};

export function OrderTimeline({ timeline = [] }) {
  if (!timeline || !timeline.length) return null;

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Lịch Sử Sự Kiện
        </Typography>
        <List dense disablePadding>
          {timeline.map((item, index) => {
            const label = EVENT_LABELS[item.event] || item.event;
            const timeStr = item.occurredAt
              ? new Date(item.occurredAt).toLocaleString('vi-VN')
              : '';
            return (
              <ListItem key={index} alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                  <Chip size="small" label={index + 1} variant="outlined" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2" fontWeight="medium">
                        {label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {timeStr}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    item.reason ? (
                      <Typography variant="caption" color="text.secondary">
                        Lý do: {item.reason}
                      </Typography>
                    ) : item.transactionReference ? (
                      <Typography variant="caption" color="text.secondary">
                        Mã giao dịch: {item.transactionReference}
                      </Typography>
                    ) : null
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
}
