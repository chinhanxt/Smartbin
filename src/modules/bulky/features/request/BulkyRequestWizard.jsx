import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  validateRequestLocation,
  validateRequestItems,
  validateHandlingConditions,
  validateCanProceedToQuote,
} from './requestValidation.js';
import { ACCEPTED_ITEM_TYPES } from '../../domain/constants.js';

const STEPS = [
  'Địa điểm & Ngày',
  'Ảnh đồ vật',
  'AI Nhận diện',
  'Xác nhận đồ',
  'Điều kiện bốc xếp',
  'Xem lại & Gửi',
];

export function BulkyRequestWizard({
  serviceLocations = [],
  onSubmit,
  onAnalyzeImages,
  initialDraft = null,
  isOffline = false,
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(initialDraft?.recognitionResult || null);

  const [formData, setFormData] = useState({
    serviceLocationId: initialDraft?.serviceLocation?.id || initialDraft?.serviceLocationId || '',
    requestedDate: initialDraft?.requestedDate || '',
    imageMetadata: initialDraft?.imageMetadata || [],
    confirmedItems: initialDraft?.confirmedItems?.length
      ? initialDraft.confirmedItems
      : [
          {
            catalogItemCode: 'SOFA',
            displayName: 'Sofa',
            quantity: 1,
            dimensionsCm: { length: 200, width: 90, height: 85 },
          },
        ],
    handlingConditions: initialDraft?.handlingConditions || {
      placement: 'GROUND_FLOOR',
      floorNumber: 0,
      hasLift: true,
      requiresDisassembly: false,
    },
  });

  const handleNext = async () => {
    let stepErrors = {};
    if (activeStep === 0) {
      stepErrors = validateRequestLocation(formData);
    } else if (activeStep === 1) {
      if (!formData.imageMetadata.length) {
        stepErrors.images = 'Vui lòng cung cấp ít nhất 1 ảnh đồ vật';
      }
    } else if (activeStep === 2) {
      // AI step: if analyzing, wait
    } else if (activeStep === 3) {
      stepErrors = validateRequestItems(formData.confirmedItems);
      const quoteCheck = validateCanProceedToQuote({
        confirmedItems: formData.confirmedItems,
        aiResult: aiResult || {},
      });
      if (!quoteCheck.allowed) {
        stepErrors.quoteCheck = quoteCheck.reason;
      }
    } else if (activeStep === 4) {
      stepErrors = validateHandlingConditions(formData.handlingConditions);
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    if (activeStep === STEPS.length - 1) {
      if (onSubmit) {
        onSubmit(formData);
      }
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setErrors({});
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  const handleRunAi = async () => {
    if (!onAnalyzeImages) return;
    setIsAnalyzing(true);
    try {
      const res = await onAnalyzeImages({ images: formData.imageMetadata });
      setAiResult(res);
      if (res.items && res.items.length > 0) {
        setFormData((prev) => ({
          ...prev,
          confirmedItems: res.items.map((item) => ({
            catalogItemCode: item.itemType,
            displayName: item.displayName || item.itemType,
            quantity: item.suggestedQuantity || 1,
            dimensionsCm: item.dimensionsCm || { length: 150, width: 80, height: 80 },
          })),
        }));
      }
    } catch {
      setErrors({ ai: 'Có lỗi xảy ra khi gọi AI nhận diện' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 720, mx: 'auto', p: 2 }}>
      {isOffline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Đang ở chế độ ngoại tuyến — <strong>Bản nháp lưu cục bộ</strong>. Yêu cầu sẽ được gửi
            lên hệ thống khi có kết nối lại.
          </Typography>
        </Alert>
      )}

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
        <CardContent>
          {/* STEP 0: Location and Date */}
          {activeStep === 0 && (
            <Stack spacing={3}>
              <Typography variant="h6">1. Chọn địa điểm và ngày thu gom</Typography>
              <FormControl fullWidth error={Boolean(errors.serviceLocationId)}>
                <InputLabel id="service-location-label">Địa điểm thu gom</InputLabel>
                <Select
                  labelId="service-location-label"
                  label="Địa điểm thu gom"
                  value={formData.serviceLocationId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, serviceLocationId: e.target.value }))
                  }
                >
                  {serviceLocations.map((loc) => (
                    <MenuItem key={loc.id} value={loc.id}>
                      {loc.address} (Khu vực: {loc.serviceArea?.code || 'Tiêu chuẩn'})
                    </MenuItem>
                  ))}
                </Select>
                {errors.serviceLocationId && (
                  <Typography variant="caption" color="error">
                    {errors.serviceLocationId}
                  </Typography>
                )}
              </FormControl>

              <TextField
                type="date"
                label="Ngày thu gom mong muốn"
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                value={formData.requestedDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, requestedDate: e.target.value }))
                }
                error={Boolean(errors.requestedDate)}
                helperText={errors.requestedDate}
              />
            </Stack>
          )}

          {/* STEP 1: Photos & Metadata */}
          {activeStep === 1 && (
            <Stack spacing={3}>
              <Typography variant="h6">2. Cung cấp hình ảnh đồ cồng kềnh</Typography>
              <Typography variant="body2" color="text.secondary">
                Chụp ảnh rõ nét các góc của đồ cồng kềnh để AI phân tích kích thước và ước lượng xe
                gom phù hợp.
              </Typography>

              <Alert severity="info">
                Lưu ý: Để đảm bảo bảo mật và hiệu năng, chỉ thông tin mô tả an toàn của ảnh được lưu
                trữ.
              </Alert>

              <Button variant="outlined" component="label" sx={{ py: 2, borderStyle: 'dashed' }}>
                Tải ảnh lên từ thiết bị
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const metas = files.map((f) => ({
                      filename: f.name,
                      sizeBytes: f.size,
                      mimeType: f.type,
                    }));
                    setFormData((prev) => ({ ...prev, imageMetadata: metas }));
                  }}
                />
              </Button>

              {errors.images && (
                <Typography variant="caption" color="error">
                  {errors.images}
                </Typography>
              )}

              {formData.imageMetadata.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Ảnh đã chọn ({formData.imageMetadata.length}):
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {formData.imageMetadata.map((meta, i) => (
                      <Chip
                        key={i}
                        label={`${meta.filename} (${Math.round(meta.sizeBytes / 1024)} KB)`}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}

          {/* STEP 2: AI Suggestion */}
          {activeStep === 2 && (
            <Stack spacing={3}>
              <Typography variant="h6">3. AI Phân tích & Nhận diện đồ cồng kềnh</Typography>
              <Typography variant="body2" color="text.secondary">
                Hệ thống AI sẽ gợi ý loại đồ và kích thước tiêu chuẩn. Kết quả AI chỉ mang tính tham
                khảo, bạn có toàn quyền chỉnh sửa ở bước kế tiếp.
              </Typography>

              <Button
                variant="contained"
                onClick={handleRunAi}
                disabled={isAnalyzing}
                startIcon={isAnalyzing ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {isAnalyzing ? 'Đang phân tích...' : 'Bắt đầu phân tích AI'}
              </Button>

              {errors.ai && <Alert severity="error">{errors.ai}</Alert>}

              {aiResult && (
                <Box sx={{ mt: 2 }}>
                  {aiResult.requiresManualReview ? (
                    <Alert severity="warning">
                      <strong>Cần nhân viên hỗ trợ xem xét:</strong> AI phát hiện đồ vật có thể
                      ngoài danh mục tiêu chuẩn hoặc không thể nhận diện rõ. Đơn sẽ chuyển sang
                      trạng thái duyệt trước khi báo giá.
                    </Alert>
                  ) : (
                    <Alert severity="success">
                      <strong>Gợi ý của AI:</strong> Nhận diện thành công loại đồ vật. Bạn có thể
                      xác nhận hoặc chỉnh sửa thông tin ở bước tiếp theo.
                    </Alert>
                  )}
                </Box>
              )}
            </Stack>
          )}

          {/* STEP 3: Confirmed Items */}
          {activeStep === 3 && (
            <Stack spacing={3}>
              <Typography variant="h6">4. Xác nhận danh mục và kích thước đồ vật</Typography>
              {errors.quoteCheck && <Alert severity="error">{errors.quoteCheck}</Alert>}

              {formData.confirmedItems.map((item, idx) => (
                <Card key={idx} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel id={`item-type-${idx}`}>Loại đồ</InputLabel>
                      <Select
                        labelId={`item-type-${idx}`}
                        label="Loại đồ"
                        value={item.catalogItemCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => {
                            const nextItems = [...prev.confirmedItems];
                            nextItems[idx].catalogItemCode = val;
                            nextItems[idx].displayName = val;
                            return { ...prev, confirmedItems: nextItems };
                          });
                        }}
                      >
                        {ACCEPTED_ITEM_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      type="number"
                      label="Số lượng"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1;
                        setFormData((prev) => {
                          const nextItems = [...prev.confirmedItems];
                          nextItems[idx].quantity = val;
                          return { ...prev, confirmedItems: nextItems };
                        });
                      }}
                    />

                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        label="Dài (cm)"
                        type="number"
                        value={item.dimensionsCm?.length || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData((prev) => {
                            const nextItems = [...prev.confirmedItems];
                            nextItems[idx].dimensionsCm = {
                              ...nextItems[idx].dimensionsCm,
                              length: val,
                            };
                            return { ...prev, confirmedItems: nextItems };
                          });
                        }}
                      />
                      <TextField
                        size="small"
                        label="Rộng (cm)"
                        type="number"
                        value={item.dimensionsCm?.width || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData((prev) => {
                            const nextItems = [...prev.confirmedItems];
                            nextItems[idx].dimensionsCm = {
                              ...nextItems[idx].dimensionsCm,
                              width: val,
                            };
                            return { ...prev, confirmedItems: nextItems };
                          });
                        }}
                      />
                      <TextField
                        size="small"
                        label="Cao (cm)"
                        type="number"
                        value={item.dimensionsCm?.height || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData((prev) => {
                            const nextItems = [...prev.confirmedItems];
                            nextItems[idx].dimensionsCm = {
                              ...nextItems[idx].dimensionsCm,
                              height: val,
                            };
                            return { ...prev, confirmedItems: nextItems };
                          });
                        }}
                      />
                    </Stack>
                  </Stack>
                </Card>
              ))}

              <Button
                variant="outlined"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    confirmedItems: [
                      ...prev.confirmedItems,
                      {
                        catalogItemCode: 'SOFA',
                        displayName: 'Sofa',
                        quantity: 1,
                        dimensionsCm: { length: 100, width: 80, height: 80 },
                      },
                    ],
                  }))
                }
              >
                + Thêm đồ khác
              </Button>
            </Stack>
          )}

          {/* STEP 4: Handling conditions */}
          {activeStep === 4 && (
            <Stack spacing={3}>
              <Typography variant="h6">5. Điều kiện bốc xếp & Vận chuyển</Typography>

              <FormControl fullWidth>
                <InputLabel id="placement-label">Vị trí đặt đồ</InputLabel>
                <Select
                  labelId="placement-label"
                  label="Vị trí đặt đồ"
                  value={formData.handlingConditions.placement}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      handlingConditions: { ...prev.handlingConditions, placement: e.target.value },
                    }))
                  }
                >
                  <MenuItem value="CURBSIDE">Vỉa hè / Mặt đường</MenuItem>
                  <MenuItem value="GROUND_FLOOR">Tầng trệt trong nhà</MenuItem>
                  <MenuItem value="UPPER_FLOOR">Tầng lầu / Chung cư</MenuItem>
                </Select>
              </FormControl>

              {formData.handlingConditions.placement === 'UPPER_FLOOR' && (
                <Stack spacing={2}>
                  <TextField
                    type="number"
                    label="Số tầng lầu"
                    value={formData.handlingConditions.floorNumber}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setFormData((prev) => ({
                        ...prev,
                        handlingConditions: { ...prev.handlingConditions, floorNumber: val },
                      }));
                    }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.handlingConditions.hasLift}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            handlingConditions: {
                              ...prev.handlingConditions,
                              hasLift: e.target.checked,
                            },
                          }))
                        }
                      />
                    }
                    label="Có thang máy vận chuyển"
                  />
                </Stack>
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.handlingConditions.requiresDisassembly}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        handlingConditions: {
                          ...prev.handlingConditions,
                          requiresDisassembly: e.target.checked,
                        },
                      }))
                    }
                  />
                }
                label="Yêu cầu tháo lắp trước khi mang ra xe"
              />
            </Stack>
          )}

          {/* STEP 5: Review and Submit */}
          {activeStep === 5 && (
            <Stack spacing={3}>
              <Typography variant="h6">6. Xem lại & Xác nhận gửi yêu cầu</Typography>
              <Divider />
              <Typography variant="body1">
                <strong>Ngày thu gom:</strong> {formData.requestedDate}
              </Typography>
              <Typography variant="body1">
                <strong>Số lượng đồ:</strong> {formData.confirmedItems.length} món
              </Typography>
              <Typography variant="body1">
                <strong>Vị trí bốc xếp:</strong> {formData.handlingConditions.placement} (Tầng:{' '}
                {formData.handlingConditions.floorNumber || 0}, Thang máy:{' '}
                {formData.handlingConditions.hasLift ? 'Có' : 'Không'})
              </Typography>

              <Alert severity="info">
                Sau khi gửi yêu cầu, hệ thống sẽ kiểm tra sức chứa và tạo báo giá minh bạch theo
                khung giờ thu gom.
              </Alert>
            </Stack>
          )}
        </CardContent>
      </Card>

      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        <Button disabled={activeStep === 0} onClick={handleBack}>
          Quay lại
        </Button>
        <Button variant="contained" onClick={handleNext}>
          {activeStep === STEPS.length - 1 ? 'Xác nhận & Gửi yêu cầu' : 'Tiếp theo'}
        </Button>
      </Stack>
    </Box>
  );
}
