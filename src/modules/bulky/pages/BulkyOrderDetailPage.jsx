import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  selectBulkyOrderById,
  selectOrderActions,
  selectRefundProgress,
  selectCanReadBulky,
} from '../store/selectors.js';
import { OrderTimeline } from '../features/orders/OrderTimeline.jsx';
import { RescheduleDialog } from '../features/orders/RescheduleDialog.jsx';
import { CancelDialog } from '../features/orders/CancelDialog.jsx';
import { RefundTracker } from '../features/orders/RefundTracker.jsx';
import { PAYMENT_STATUS } from '../domain/constants.js';

export function BulkyOrderDetailPage({ thunks }) {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const canRead = useSelector(selectCanReadBulky);
  const order = useSelector((state) => selectBulkyOrderById(state, orderId));
  const actions = useSelector((state) => selectOrderActions(state, orderId), shallowEqual);
  const refundProgress = useSelector((state) => selectRefundProgress(state, orderId), shallowEqual);

  const [openReschedule, setOpenReschedule] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (orderId && thunks?.fetchOrderById && dispatch) {
      dispatch(thunks.fetchOrderById(orderId));
    }
  }, [orderId, thunks, dispatch]);

  const formatVnd = (val) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  const handleConfirmReschedule = async ({ requestedDate, reason }) => {
    setIsProcessing(true);
    setActionError(null);
    try {
      if (thunks?.rescheduleOrder && dispatch) {
        await dispatch(thunks.rescheduleOrder({ orderId, requestedDate, reason }));
      }
      setOpenReschedule(false);
    } catch (err) {
      setActionError(err.message || 'Không thể gửi yêu cầu đổi ngày');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmCancel = async (reason) => {
    setIsProcessing(true);
    setActionError(null);
    try {
      if (thunks?.cancelOrder && dispatch) {
        await dispatch(thunks.cancelOrder({ orderId, reason }));
      }
      setOpenCancel(false);
    } catch (err) {
      setActionError(err.message || 'Không thể hủy đơn');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!canRead) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Bạn không có quyền xem thông tin đơn rác cồng kềnh (Yêu cầu quyền VIEW_BULKY_ORDERS).
        </Alert>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">Không tìm thấy thông tin đơn hàng.</Alert>
      </Container>
    );
  }

  const isPaid = order.paymentStatus === PAYMENT_STATUS.SUCCESS;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {order.orderId}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Chi tiết yêu cầu thu gom rác cồng kềnh
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip label={order.orderStatus} color="primary" />
          <Chip
            label={isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
            color={isPaid ? 'success' : 'default'}
            variant="outlined"
          />
        </Stack>
      </Box>

      {actionError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {actionError}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Refund tracker */}
        {refundProgress.hasRefund && (
          <RefundTracker refund={refundProgress.refund} refundStatus={refundProgress.status} />
        )}

        {/* General Details Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Thông Tin Thu Gom
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Địa chỉ:</strong> {order.serviceLocation?.address || 'Chưa cập nhật'}
              </Typography>
              <Typography variant="body2">
                <strong>Ngày hẹn thu gom:</strong>{' '}
                {order.confirmedServiceWindow?.date || order.requestedDate || 'Chưa xếp lịch'}
              </Typography>
              <Typography variant="body2">
                <strong>Điều kiện bốc xếp:</strong> Vị trí{' '}
                {order.handlingConditions?.placement || 'Mặt đường'}, Tầng:{' '}
                {order.handlingConditions?.floorNumber || 0} (
                {order.handlingConditions?.hasLift ? 'Có thang máy' : 'Không thang máy'})
              </Typography>
              <Typography variant="body2">
                <strong>Tổng chi phí:</strong>{' '}
                <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {formatVnd(order.acceptedQuote?.totalVnd)}
                </span>
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Confirmed Items Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Danh Mục Đồ Cồng Kềnh
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tên đồ vật</TableCell>
                  <TableCell align="right">Số lượng</TableCell>
                  <TableCell align="right">Kích thước (DxRxC cm)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(order.confirmedItems || []).map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{item.displayName || item.catalogItemCode}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">
                      {item.dimensionsCm
                        ? `${item.dimensionsCm.length || 0}x${item.dimensionsCm.width || 0}x${item.dimensionsCm.height || 0}`
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Action Controls */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {actions.canPay && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate(`/bulky/payment/${order.orderId}`)}
            >
              Thanh toán ngay
            </Button>
          )}
          {actions.canReschedule && (
            <Button variant="outlined" onClick={() => setOpenReschedule(true)}>
              Đổi ngày thu gom
            </Button>
          )}
          {actions.canCancel && (
            <Button variant="outlined" color="error" onClick={() => setOpenCancel(true)}>
              Hủy đơn
            </Button>
          )}
        </Box>

        {/* Timeline */}
        <OrderTimeline timeline={order.timeline} />
      </Stack>

      <RescheduleDialog
        open={openReschedule}
        onClose={() => setOpenReschedule(false)}
        currentDate={order.confirmedServiceWindow?.date || order.requestedDate}
        onConfirmReschedule={handleConfirmReschedule}
        isLoading={isProcessing}
      />

      <CancelDialog
        open={openCancel}
        onClose={() => setOpenCancel(false)}
        isPaid={isPaid}
        onConfirmCancel={handleConfirmCancel}
        isLoading={isProcessing}
      />
    </Container>
  );
}

export default BulkyOrderDetailPage;
