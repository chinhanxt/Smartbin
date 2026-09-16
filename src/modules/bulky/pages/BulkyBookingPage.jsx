import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Container, Alert } from '@mui/material';
import { BulkyRequestWizard } from '../features/request/BulkyRequestWizard.jsx';
import { selectBulkyDraft, selectCanManageBulky } from '../store/selectors.js';

export function BulkyBookingPage({
  serviceLocations = [
    {
      id: 'loc-1',
      address: '123 Nguyen Trai, Phuong 3, Quan 5, TP.HCM',
      latitude: 10.756,
      longitude: 106.678,
      serviceArea: { code: 'D5' },
    },
  ],
  thunks,
  services,
  onBookingCreated,
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const canManage = useSelector(selectCanManageBulky);
  const currentDraft = useSelector(selectBulkyDraft);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAnalyzeImages = async (input) => {
    if (services?.recognition?.analyzeImages) {
      return services.recognition.analyzeImages(input);
    }
    return {
      decision: 'SUGGESTED',
      requiresManualReview: false,
      items: [
        {
          itemType: 'SOFA',
          displayName: 'Sofa da 3 chỗ',
          suggestedQuantity: 1,
          dimensionsCm: { length: 200, width: 90, height: 85 },
        },
      ],
    };
  };

  const handleSubmit = async (formData) => {
    setSubmitError(null);
    try {
      let createdOrder;
      if (thunks?.createDraftOrder && dispatch) {
        createdOrder = await dispatch(
          thunks.createDraftOrder({
            serviceLocationId: formData.serviceLocationId,
            requestedDate: formData.requestedDate,
            imageMetadata: formData.imageMetadata,
            handlingConditions: formData.handlingConditions,
          }),
        );
        if (createdOrder?.orderId && thunks?.confirmOrderItems) {
          await dispatch(
            thunks.confirmOrderItems(createdOrder.orderId, {
              confirmedItems: formData.confirmedItems,
              handlingConditions: formData.handlingConditions,
            }),
          );
        }
      }

      if (onBookingCreated) {
        onBookingCreated(createdOrder || formData);
      } else if (createdOrder?.orderId) {
        navigate(`/bulky/quote/${createdOrder.orderId}`);
      }
    } catch (err) {
      setSubmitError(err.message || 'Không thể tạo đơn đặt thu gom');
    }
  };

  if (!canManage) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Bạn không có quyền quản lý đơn đặt thu gom rác cồng kềnh (Yêu cầu quyền
          MANAGE_BULKY_ORDERS).
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Đặt Lịch Thu Gom Rác Cồng Kềnh
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quy trình 5 bước minh bạch — Định giá tự động và hỗ trợ nhận diện AI
        </Typography>
      </Box>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <BulkyRequestWizard
        serviceLocations={serviceLocations}
        initialDraft={currentDraft}
        onAnalyzeImages={handleAnalyzeImages}
        onSubmit={handleSubmit}
        isOffline={isOffline}
      />
    </Container>
  );
}

export default BulkyBookingPage;
