import { Box, Typography, Card, CardContent, Button, Stack, Alert } from '@mui/material';

export function LatePaymentReconciliation({
  resolution,
  onAcceptAlternative,
  onChooseRefund,
  isLoading = false,
}) {
  if (!resolution) return null;

  return (
    <Card variant="outlined" sx={{ p: 2, borderColor: 'warning.main', bgcolor: 'warning.lighter' }}>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" color="warning.dark">
              Xử Lý Thanh Toán Muộn (Hết Hạn Giữ Chỗ)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Giao dịch thanh toán thành công nhưng vị trí giữ chỗ ban đầu đã hết hạn trước khi hoàn
              tất giao dịch.
            </Typography>
          </Box>

          <Alert severity="warning">
            Hệ thống không tự ý đổi ngày thu gom mà cần sự xác nhận của người dân. Bạn có thể chọn
            ngày phục vụ mới còn chỗ trống hoặc nhận lại tiền hoàn toàn bộ.
          </Alert>

          {resolution.offeredDates?.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Các ngày thay thế còn xe phục vụ:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {resolution.offeredDates.map((date) => (
                  <Button
                    key={date}
                    variant="outlined"
                    size="small"
                    disabled={isLoading}
                    onClick={() => onAcceptAlternative && onAcceptAlternative(date)}
                  >
                    {date}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}

          <Box sx={{ pt: 1 }}>
            <Button
              variant="contained"
              color="error"
              disabled={isLoading}
              onClick={() => onChooseRefund && onChooseRefund()}
            >
              Yêu cầu hoàn tiền toàn phần
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
