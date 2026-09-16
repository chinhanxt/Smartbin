import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Chip,
  Stack,
  Alert,
} from '@mui/material';
import { selectBulkyOrders, selectCanReadBulky, selectCanManageBulky } from '../store/selectors.js';
import { ORDER_STATUS, PAYMENT_STATUS, REFUND_STATUS } from '../domain/constants.js';

export function BulkyOrdersPage({ thunks }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const canRead = useSelector(selectCanReadBulky);
  const canManage = useSelector(selectCanManageBulky);
  const orders = useSelector(selectBulkyOrders);

  useEffect(() => {
    if (thunks?.fetchOrders && dispatch) {
      dispatch(thunks.fetchOrders());
    }
  }, [thunks, dispatch]);

  const formatVnd = (val) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  const getOrderStatusColor = (status) => {
    switch (status) {
      case ORDER_STATUS.CONFIRMED:
      case ORDER_STATUS.COMPLETED:
        return 'success';
      case ORDER_STATUS.CANCELLED:
        return 'error';
      case ORDER_STATUS.AWAITING_PAYMENT:
      case ORDER_STATUS.MANUAL_REVIEW:
        return 'warning';
      default:
        return 'default';
    }
  };

  if (!canRead) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Bạn không có quyền xem danh sách đơn rác cồng kềnh (Yêu cầu quyền VIEW_BULKY_ORDERS).
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Đơn Thu Gom Rác Cồng Kềnh
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý các yêu cầu thu gom sofa, nệm, tủ gỗ và tiến trình xử lý
          </Typography>
        </Box>
        {canManage && orders.length > 0 && (
          <Button variant="contained" onClick={() => navigate('/bulky/booking')}>
            Tạo yêu cầu mới
          </Button>
        )}
      </Box>

      {orders.length === 0 ? (
        <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Chưa có đơn thu gom rác cồng kềnh nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Gửi yêu cầu thu gom đồ đạc cũ, rác cỡ lớn để được định giá minh bạch và sắp xếp xe vận
              chuyển tận nơi.
            </Typography>
            {canManage && (
              <Button variant="contained" onClick={() => navigate('/bulky/booking')}>
                Tạo yêu cầu mới
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {orders.map((order) => (
            <Card key={order.orderId} variant="outlined">
              <CardActionArea onClick={() => navigate(`/bulky/orders/${order.orderId}`)}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      {order.orderId}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={order.orderStatus}
                        color={getOrderStatusColor(order.orderStatus)}
                        size="small"
                      />
                      {order.paymentStatus && (
                        <Chip
                          label={
                            order.paymentStatus === PAYMENT_STATUS.SUCCESS
                              ? 'Đã thanh toán'
                              : 'Chưa thanh toán'
                          }
                          color={
                            order.paymentStatus === PAYMENT_STATUS.SUCCESS ? 'success' : 'default'
                          }
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {order.refundStatus && order.refundStatus !== REFUND_STATUS.NONE && (
                        <Chip
                          label={`Hoàn tiền: ${order.refundStatus}`}
                          color="warning"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Địa chỉ: {order.serviceLocation?.address || 'Chưa cập nhật địa chỉ'}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="body2">
                      Ngày thu gom:{' '}
                      <strong>
                        {order.confirmedServiceWindow?.date || order.requestedDate || 'Chưa chọn'}
                      </strong>
                    </Typography>
                    <Typography variant="subtitle1" color="primary" fontWeight="bold">
                      {formatVnd(order.acceptedQuote?.totalVnd)}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}

export default BulkyOrdersPage;
