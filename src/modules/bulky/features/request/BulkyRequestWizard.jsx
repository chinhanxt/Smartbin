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
  FormLabel,
  Select,
  FormControlLabel,
  Switch,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  validateRequestItems,
  validateCanProceedToQuote,
  validateStepLogistics,
} from './requestValidation.js';
import { ACCEPTED_ITEM_TYPES, MATERIAL_TYPES, MATERIAL_FACTORS } from '../../domain/constants.js';

const BASE_WEIGHTS = {
  SOFA: 45,
  MATTRESS: 25,
  CABINET: 40,
  TABLE: 20,
  OTHER: 15,
};

const BASE_ITEM_PRICES = {
  SOFA: 150000,
  MATTRESS: 100000,
  CABINET: 120000,
  TABLE: 80000,
  OTHER: 60000,
};

function formatCurrency(val) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
}

const STEPS = ['Ảnh đồ vật & AI Quét', 'Địa điểm & Bốc xếp', 'Xem lại & Báo giá'];

const ITEM_ICONS = {
  SOFA: '🛋️',
  MATTRESS: '🛏️',
  WARDROBE: '🚪',
  CABINET: '🚪',
  TABLE: '🪑',
  APPLIANCE: '🧊',
  OTHER: '📦',
};

const ITEM_TYPE_LABELS = {
  SOFA: '🛋️ Sofa / Ghế dài phòng khách',
  MATTRESS: '🛏️ Nệm / Đệm giường ngủ',
  CABINET: '🚪 Tủ quần áo / Kệ tủ các loại',
  TABLE: '🪑 Bàn / Ghế các loại (Bàn ăn, Ghế ngồi...)',
  OTHER: '📦 Đồ cồng kềnh khác',
};

function getItemVisual(item) {
  const name = (item.displayName || '').toLowerCase();
  if (name.includes('ghế') || name.includes('chair')) return { icon: '🪑', label: 'Ghế' };
  if (name.includes('bàn') || name.includes('table')) return { icon: '🪵', label: 'Bàn' };
  if (name.includes('sofa') || name.includes('salon')) return { icon: '🛋️', label: 'Sofa' };
  if (name.includes('nệm') || name.includes('đệm') || name.includes('mattress'))
    return { icon: '🛏️', label: 'Nệm' };
  if (name.includes('tủ') || name.includes('cabinet') || name.includes('wardrobe'))
    return { icon: '🚪', label: 'Tủ' };
  return { icon: ITEM_ICONS[item.catalogItemCode] || '📦', label: item.catalogItemCode };
}

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
  const [apiKey, setApiKey] = useState(
    () =>
      (typeof localStorage !== 'undefined' && localStorage.getItem('smartbin_gemini_api_key')) ||
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
      '',
  );
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [keySavedMessage, setKeySavedMessage] = useState(false);

  const [formData, setFormData] = useState({
    serviceLocationId: initialDraft?.serviceLocation?.id || initialDraft?.serviceLocationId || '',
    requestedDate: initialDraft?.requestedDate || '',
    imageMetadata: initialDraft?.imageMetadata || [],
    confirmedItems: initialDraft?.confirmedItems?.length
      ? initialDraft.confirmedItems.map((item) => ({
          ...item,
          material: item.material || 'STANDARD',
        }))
      : [
          {
            catalogItemCode: 'SOFA',
            displayName: 'Sofa da 3 chỗ',
            quantity: 1,
            dimensionsCm: { length: 200, width: 90, height: 85 },
            material: 'STANDARD',
          },
        ],
    handlingConditions: initialDraft?.handlingConditions || {
      placement: 'GROUND_FLOOR',
      floorNumber: 0,
      hasLift: true,
      requiresDisassembly: false,
    },
  });

  // Live range pricing and weight calculations
  let itemsMinVnd = 0;
  let totalEstimatedWeightKg = 0;
  for (const it of formData.confirmedItems) {
    const basePrice = BASE_ITEM_PRICES[it.catalogItemCode] || 80000;
    const mat = it.material || 'STANDARD';
    const priceFactor = MATERIAL_FACTORS[mat]?.priceFactor || 1;
    const unitPrice = Math.round(basePrice * priceFactor);
    itemsMinVnd += unitPrice * (it.quantity || 1);

    const baseWeight = it.baseWeightKg || it.baseWeight || BASE_WEIGHTS[it.catalogItemCode] || 30;
    const weightFactor = MATERIAL_FACTORS[mat]?.weightFactor || 1;
    totalEstimatedWeightKg += Math.round(baseWeight * weightFactor) * (it.quantity || 1);
  }

  let handlingFees = 0;
  if (formData.handlingConditions?.floorNumber > 0) {
    handlingFees += 20000 * formData.handlingConditions.floorNumber;
  }
  if (formData.handlingConditions?.requiresDisassembly) {
    handlingFees += 30000;
  }
  const areaFee = 25000;
  const minVnd = itemsMinVnd + handlingFees + areaFee;
  const maxVnd = Math.round(minVnd * 1.3);
  const depositHoldVnd = minVnd;

  // Fast testing preset images
  const samplePresets = [
    {
      name: 'Sofa da phòng khách',
      icon: '🛋️',
      meta: { filename: 'sofa_da_phong_khach.jpg', sizeBytes: 1024 * 380, mimeType: 'image/jpeg' },
    },
    {
      name: 'Nệm lò xo đôi 1m8',
      icon: '🛏️',
      meta: { filename: 'nem_lo_xo_1m8.jpg', sizeBytes: 1024 * 450, mimeType: 'image/jpeg' },
    },
    {
      name: 'Tủ quần áo gỗ 3 cánh',
      icon: '🚪',
      meta: { filename: 'tu_go_3_canh.jpg', sizeBytes: 1024 * 620, mimeType: 'image/jpeg' },
    },
  ];

  const handleAddPresetPhoto = (presetMeta) => {
    setFormData((prev) => ({
      ...prev,
      imageMetadata: [...prev.imageMetadata, presetMeta],
    }));
    if (errors.images) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.images;
        return next;
      });
    }
  };

  const handleRemovePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageMetadata: prev.imageMetadata.filter((_, i) => i !== index),
    }));
  };

  // Helper date setter
  const setQuickDate = (daysFromNow) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const dateStr = d.toISOString().split('T')[0];
    setFormData((prev) => ({ ...prev, requestedDate: dateStr }));
    if (errors.requestedDate) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.requestedDate;
        return next;
      });
    }
  };

  const handleNext = async () => {
    let stepErrors = {};
    if (activeStep === 0) {
      if (!formData.imageMetadata.length) {
        stepErrors.images = 'Vui lòng cung cấp ít nhất 1 ảnh đồ vật';
      }
      const itemErrors = validateRequestItems(formData.confirmedItems);
      if (itemErrors.confirmedItems) {
        stepErrors.confirmedItems = itemErrors.confirmedItems;
      }
      const quoteCheck = validateCanProceedToQuote({
        confirmedItems: formData.confirmedItems,
        aiResult: aiResult || {},
      });
      if (!quoteCheck.allowed) {
        stepErrors.quoteCheck = quoteCheck.reason;
      }
    } else if (activeStep === 1) {
      stepErrors = validateStepLogistics(formData);
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
      const res = await onAnalyzeImages({
        images: formData.imageMetadata,
        apiKey: apiKey?.trim(),
      });
      setAiResult(res);
      if (res?.items && res.items.length > 0) {
        const hasDisassemblyNeeded = res.items.some((it) => it.disassemblyNeeded);
        setFormData((prev) => ({
          ...prev,
          confirmedItems: res.items.map((item) => ({
            catalogItemCode: item.catalogItemCode || item.itemType || 'OTHER',
            displayName: item.displayName || item.itemType,
            quantity: item.suggestedQuantity || 1,
            dimensionsCm: item.dimensionsCm || { length: 150, width: 80, height: 80 },
            material: item.material || 'STANDARD',
          })),
          handlingConditions: {
            ...prev.handlingConditions,
            requiresDisassembly:
              hasDisassemblyNeeded || prev.handlingConditions.requiresDisassembly,
          },
        }));
      }
    } catch {
      setErrors({ ai: 'Có lỗi xảy ra khi gọi AI nhận diện' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 760, mx: 'auto' }}>
      {isOffline && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="body2">
            Đang ở chế độ ngoại tuyến — <strong>Bản nháp lưu cục bộ</strong>. Yêu cầu sẽ được gửi
            lên hệ thống khi có kết nối lại.
          </Typography>
        </Alert>
      )}

      {/* Stepper Card with Modern Progress Bar */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        <Box sx={{ height: 4, width: '100%', backgroundColor: '#f1f5f9' }}>
          <Box
            sx={{
              height: '100%',
              width: `${((activeStep + 1) / STEPS.length) * 100}%`,
              backgroundColor: '#1d4ed8',
              transition: 'width 0.3s ease',
            }}
          />
        </Box>
        <Box sx={{ p: 2.5 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              color="#1d4ed8"
              sx={{ letterSpacing: '0.05em' }}
            >
              BƯỚC {activeStep + 1} / {STEPS.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              {STEPS[activeStep]}
            </Typography>
          </Box>
          <Stepper
            activeStep={activeStep}
            alternativeLabel
            sx={{ '& .MuiStepLabel-label': { fontSize: '0.8rem', mt: 0.5 } }}
          >
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Card>

      {/* Wizard Step Content Card */}
      <Card
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 3,
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          backgroundColor: '#ffffff',
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* STEP 0: Photos & Real-time AI Vision & Confirmed Items */}
          {activeStep === 0 && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a' }}>
                  1. Chụp ảnh & AI quét đồ trực tiếp
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Tải ảnh đồ cũ để Gemini AI tự động quét danh mục hoặc thêm đồ thủ công trực tiếp
                  bên dưới.
                </Typography>
              </Box>

              {/* Upload Dropzone */}
              <Box
                component="label"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 3.5,
                  borderRadius: 2.5,
                  border: '2px dashed #cbd5e1',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#1d4ed8',
                    backgroundColor: '#eff6ff',
                  },
                }}
              >
                <Box sx={{ fontSize: '2.5rem', mb: 1 }}>📸</Box>
                <Typography variant="subtitle1" fontWeight="bold" color="#1e293b">
                  Tải ảnh lên từ thiết bị (hoặc chụp ảnh)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5 }}>
                  Hỗ trợ định dạng JPG, PNG, WebP (Tối đa 10MB)
                </Typography>
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;

                    files.forEach((f) => {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const dataUrl = ev.target?.result;
                        const base64 =
                          typeof dataUrl === 'string' ? dataUrl.split('base64,')[1] : null;
                        setFormData((prev) => ({
                          ...prev,
                          imageMetadata: [
                            ...prev.imageMetadata,
                            {
                              filename: f.name,
                              sizeBytes: f.size,
                              mimeType: f.type || 'image/jpeg',
                              dataUrl,
                              base64,
                            },
                          ],
                        }));
                      };
                      reader.readAsDataURL(f);
                    });

                    if (errors.images) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.images;
                        return next;
                      });
                    }
                  }}
                />
              </Box>

              {errors.images && (
                <Typography variant="caption" color="error">
                  {errors.images}
                </Typography>
              )}

              {/* 1-Click Tester Presets */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#0f172a', mb: 1 }}>
                  ✨ Thử nghiệm nhanh (Mẫu ảnh chụp sẵn):
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {samplePresets.map((preset, idx) => (
                    <Button
                      key={idx}
                      size="small"
                      variant="outlined"
                      onClick={() => handleAddPresetPhoto(preset.meta)}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.8rem',
                        borderColor: '#cbd5e1',
                        color: '#334155',
                        backgroundColor: '#ffffff',
                        '&:hover': { borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
                      }}
                    >
                      {preset.icon} + {preset.name}
                    </Button>
                  ))}
                </Stack>
              </Box>

              {/* Photos List Preview */}
              {formData.imageMetadata.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#0f172a' }}>
                    Ảnh đã chọn ({formData.imageMetadata.length}):
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {formData.imageMetadata.map((meta, i) => (
                      <Chip
                        key={i}
                        avatar={
                          meta.dataUrl ? (
                            <Box
                              component="img"
                              src={meta.dataUrl}
                              alt={meta.filename}
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : undefined
                        }
                        label={`${meta.filename} (${Math.round(meta.sizeBytes / 1024)} KB)`}
                        onDelete={() => handleRemovePhoto(i)}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: '#f1f5f9',
                          fontWeight: 500,
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* AI Engine Status Banner & Action Button */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ fontSize: '1.4rem' }}>⚡</Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#166534', fontWeight: 700 }}>
                      Google Gemini 2.5 Flash Vision
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#15803d', display: 'block' }}>
                      Tự động phân loại đồ vật, đo kích thước và phát hiện chất thải cấm
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => setShowKeyConfig((prev) => !prev)}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.8rem',
                      color: '#166534',
                      fontWeight: 600,
                    }}
                  >
                    {showKeyConfig ? 'Đóng cấu hình ▴' : 'Khóa API ▾'}
                  </Button>
                  <Button
                    variant="contained"
                    disabled={isAnalyzing}
                    onClick={handleRunAi}
                    startIcon={isAnalyzing ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{
                      backgroundColor: '#16a34a',
                      fontWeight: 700,
                      textTransform: 'none',
                      px: 2.5,
                      py: 0.8,
                      borderRadius: 2,
                      '&:hover': { backgroundColor: '#15803d' },
                    }}
                  >
                    {isAnalyzing ? 'Đang phân tích...' : '✨ Quét ảnh với AI'}
                  </Button>
                </Box>
              </Box>

              {showKeyConfig && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <Typography variant="caption" fontWeight="bold" sx={{ color: '#475569' }}>
                    KHÓA API GOOGLE GEMINI:
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Nhập khóa API Gemini (AQ.Ab8...)"
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        if (typeof localStorage !== 'undefined') {
                          localStorage.setItem('smartbin_gemini_api_key', apiKey.trim());
                        }
                        setKeySavedMessage(true);
                        setTimeout(() => setKeySavedMessage(false), 3000);
                      }}
                      sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                    >
                      Lưu Khóa
                    </Button>
                  </Stack>
                  {keySavedMessage && (
                    <Typography
                      variant="caption"
                      color="success.main"
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      ✓ Đã lưu khóa API vào bộ nhớ trình duyệt.
                    </Typography>
                  )}
                </Box>
              )}

              {errors.ai && <Alert severity="error">{errors.ai}</Alert>}

              {aiResult && (
                <Box>
                  {aiResult.containsHazardousWaste ? (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        🚫 CẢNH BÁO AN TOÀN MÔI TRƯỜNG:
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Phát hiện rác nguy hại/xây dựng:{' '}
                        <strong>{aiResult.hazardousReason || 'Chất cấm'}</strong>. Đơn sẽ chuyển
                        sang trạng thái <strong>Chờ xét duyệt thủ công</strong>.
                      </Typography>
                    </Alert>
                  ) : aiResult.requiresManualReview ? (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      <strong>Cần nhân viên hỗ trợ xem xét:</strong> AI phát hiện đồ vật có thể
                      ngoài danh mục tiêu chuẩn. Đơn sẽ được duyệt trước khi thanh toán.
                      {aiResult.explanation && (
                        <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                          Phân tích AI: "{aiResult.explanation}"
                        </Typography>
                      )}
                    </Alert>
                  ) : (
                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                      <strong>AI nhận diện thành công!</strong> Đã quét và cập nhật danh mục bên
                      dưới bởi <strong>{aiResult.aiModelUsed || 'Google Gemini 2.5 Flash'}</strong>.
                      {aiResult.explanation && (
                        <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                          "{aiResult.explanation}"
                        </Typography>
                      )}
                    </Alert>
                  )}
                </Box>
              )}

              <Divider sx={{ my: 0.5 }} />

              {/* Confirmed Items Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0f172a' }}>
                    Danh mục đồ cồng kềnh ({formData.confirmedItems.length} món)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Kiểm tra tên đồ, nhóm tính cước, số lượng và kích thước Dài × Rộng × Cao (cm)
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmedItems: [
                        ...prev.confirmedItems,
                        {
                          catalogItemCode: 'TABLE',
                          displayName: 'Bàn / Ghế',
                          quantity: 1,
                          dimensionsCm: { length: 100, width: 80, height: 75 },
                          material: 'STANDARD',
                        },
                      ],
                    }))
                  }
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#cbd5e1',
                    color: '#1d4ed8',
                    '&:hover': { borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
                  }}
                >
                  + Thêm đồ khác
                </Button>
              </Box>

              {errors.quoteCheck && <Alert severity="error">{errors.quoteCheck}</Alert>}
              {errors.confirmedItems && <Alert severity="error">{errors.confirmedItems}</Alert>}

              {/* Items list */}
              {formData.confirmedItems.map((item, idx) => {
                const visual = getItemVisual(item);

                return (
                  <Card
                    key={idx}
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 2.5,
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: '#0f172a',
                            fontWeight: 700,
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <span style={{ fontSize: '1.25rem' }}>{visual.icon}</span>
                          Món #{idx + 1}: {item.displayName || visual.label || item.catalogItemCode}
                        </Typography>
                        {formData.confirmedItems.length > 1 && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                confirmedItems: prev.confirmedItems.filter((_, i) => i !== idx),
                              }));
                            }}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                          >
                            Xóa món này
                          </Button>
                        )}
                      </Box>

                      {/* Specific item name */}
                      <FormControl fullWidth>
                        <FormLabel
                          sx={{
                            fontWeight: 600,
                            mb: 0.5,
                            color: '#0f172a',
                            fontSize: '0.85rem',
                            textAlign: 'left',
                            display: 'block',
                          }}
                        >
                          Tên đồ vật cụ thể (Do AI nhận diện / Tùy chỉnh):
                        </FormLabel>
                        <TextField
                          size="small"
                          fullWidth
                          value={item.displayName || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => {
                              const nextItems = [...prev.confirmedItems];
                              nextItems[idx].displayName = val;
                              return { ...prev, confirmedItems: nextItems };
                            });
                          }}
                          placeholder="Ví dụ: Bàn tròn, Ghế ăn cafe, Sofa da..."
                          sx={{
                            backgroundColor: '#f8fafc',
                            borderRadius: 2,
                            '& .MuiInputBase-input': {
                              py: 1,
                              px: 1.5,
                              color: '#0f172a',
                              fontWeight: 600,
                            },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                          }}
                        />
                      </FormControl>

                      {/* Billing category */}
                      <FormControl fullWidth>
                        <FormLabel
                          htmlFor={`item-type-${idx}`}
                          sx={{
                            fontWeight: 600,
                            mb: 0.5,
                            color: '#0f172a',
                            fontSize: '0.85rem',
                            textAlign: 'left',
                            display: 'block',
                          }}
                        >
                          Nhóm phân loại tính cước:
                        </FormLabel>
                        <Select
                          id={`item-type-${idx}`}
                          value={item.catalogItemCode}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => {
                              const nextItems = [...prev.confirmedItems];
                              nextItems[idx].catalogItemCode = val;
                              return { ...prev, confirmedItems: nextItems };
                            });
                          }}
                          sx={{
                            borderRadius: 2,
                            backgroundColor: '#f8fafc',
                            '& .MuiSelect-select': {
                              py: 1,
                              px: 2,
                              color: '#0f172a',
                              fontWeight: 600,
                            },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                          }}
                        >
                          {ACCEPTED_ITEM_TYPES.map((type) => (
                            <MenuItem key={type} value={type} sx={{ color: '#0f172a' }}>
                              {ITEM_TYPE_LABELS[type] || type}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Quantity */}
                      <FormControl fullWidth>
                        <FormLabel
                          htmlFor={`item-qty-${idx}`}
                          sx={{
                            fontWeight: 600,
                            mb: 0.5,
                            color: '#0f172a',
                            fontSize: '0.85rem',
                            textAlign: 'left',
                            display: 'block',
                          }}
                        >
                          Số lượng:
                        </FormLabel>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{
                              minWidth: 36,
                              height: 38,
                              borderColor: '#cbd5e1',
                              color: '#0f172a',
                              fontWeight: 'bold',
                            }}
                            onClick={() => {
                              setFormData((prev) => {
                                const nextItems = [...prev.confirmedItems];
                                nextItems[idx].quantity = Math.max(
                                  1,
                                  (nextItems[idx].quantity || 1) - 1,
                                );
                                return { ...prev, confirmedItems: nextItems };
                              });
                            }}
                          >
                            -
                          </Button>
                          <TextField
                            id={`item-qty-${idx}`}
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 1;
                              setFormData((prev) => {
                                const nextItems = [...prev.confirmedItems];
                                nextItems[idx].quantity = Math.max(1, val);
                                return { ...prev, confirmedItems: nextItems };
                              });
                            }}
                            sx={{
                              width: 90,
                              backgroundColor: '#f8fafc',
                              borderRadius: 2,
                              '& .MuiInputBase-input': {
                                py: 1,
                                px: 1.5,
                                textAlign: 'center',
                                fontWeight: 700,
                                color: '#0f172a',
                              },
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                            }}
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{
                              minWidth: 36,
                              height: 38,
                              borderColor: '#cbd5e1',
                              color: '#0f172a',
                              fontWeight: 'bold',
                            }}
                            onClick={() => {
                              setFormData((prev) => {
                                const nextItems = [...prev.confirmedItems];
                                nextItems[idx].quantity = (nextItems[idx].quantity || 1) + 1;
                                return { ...prev, confirmedItems: nextItems };
                              });
                            }}
                          >
                            +
                          </Button>
                          <Typography
                            variant="body2"
                            sx={{ color: '#64748b', ml: 1, fontWeight: 500 }}
                          >
                            chiếc / cái
                          </Typography>
                        </Box>
                      </FormControl>

                      {/* Dimensions */}
                      <Box>
                        <FormLabel
                          sx={{
                            fontWeight: 600,
                            mb: 0.5,
                            color: '#0f172a',
                            fontSize: '0.85rem',
                            textAlign: 'left',
                            display: 'block',
                          }}
                        >
                          Kích thước ước tính (Dài × Rộng × Cao cm):
                        </FormLabel>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 1.5,
                            mt: 0.5,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.3 }}
                            >
                              Dài (cm)
                            </Typography>
                            <TextField
                              size="small"
                              fullWidth
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
                              sx={{
                                borderRadius: 2,
                                backgroundColor: '#f8fafc',
                                '& .MuiInputBase-input': {
                                  py: 1,
                                  px: 1.5,
                                  color: '#0f172a',
                                  fontWeight: 600,
                                  textAlign: 'center',
                                },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.3 }}
                            >
                              Rộng (cm)
                            </Typography>
                            <TextField
                              size="small"
                              fullWidth
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
                              sx={{
                                borderRadius: 2,
                                backgroundColor: '#f8fafc',
                                '& .MuiInputBase-input': {
                                  py: 1,
                                  px: 1.5,
                                  color: '#0f172a',
                                  fontWeight: 600,
                                  textAlign: 'center',
                                },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.3 }}
                            >
                              Cao (cm)
                            </Typography>
                            <TextField
                              size="small"
                              fullWidth
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
                              sx={{
                                borderRadius: 2,
                                backgroundColor: '#f8fafc',
                                '& .MuiInputBase-input': {
                                  py: 1,
                                  px: 1.5,
                                  color: '#0f172a',
                                  fontWeight: 600,
                                  textAlign: 'center',
                                },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>

                      {/* Material Survey Chips (1-Click) */}
                      <Box sx={{ mt: 1 }}>
                        <FormLabel
                          sx={{
                            fontWeight: 600,
                            mb: 1,
                            color: '#0f172a',
                            fontSize: '0.85rem',
                            textAlign: 'left',
                            display: 'block',
                          }}
                        >
                          Chất liệu vật dụng (Khảo sát 1-chạm):
                        </FormLabel>
                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          sx={{ flexWrap: 'wrap', gap: 1 }}
                        >
                          {Object.values(MATERIAL_TYPES).map((matKey) => {
                            const isSelected = (item.material || 'STANDARD') === matKey;
                            const factorObj = MATERIAL_FACTORS[matKey];
                            return (
                              <Chip
                                key={matKey}
                                clickable
                                label={factorObj.label}
                                onClick={() => {
                                  setFormData((prev) => {
                                    const nextItems = [...prev.confirmedItems];
                                    nextItems[idx] = { ...nextItems[idx], material: matKey };
                                    return { ...prev, confirmedItems: nextItems };
                                  });
                                }}
                                sx={{
                                  fontWeight: isSelected ? 700 : 500,
                                  cursor: 'pointer',
                                  borderColor: isSelected ? '#1d4ed8' : '#cbd5e1',
                                  backgroundColor: isSelected ? '#1d4ed8' : '#f8fafc',
                                  color: isSelected ? '#ffffff' : '#334155',
                                  borderWidth: 1.5,
                                  borderStyle: 'solid',
                                  transition: 'all 0.15s ease',
                                  '&:hover': {
                                    backgroundColor: isSelected ? '#1e40af' : '#eff6ff',
                                    borderColor: '#1d4ed8',
                                  },
                                }}
                              />
                            );
                          })}
                        </Stack>
                        <Box sx={{ mt: 1.2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                            ⚖️ Khối lượng ước tính:
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 700 }}>
                            ~
                            {Math.round(
                              (item.baseWeightKg ||
                                item.baseWeight ||
                                BASE_WEIGHTS[item.catalogItemCode] ||
                                30) *
                                (MATERIAL_FACTORS[item.material || 'STANDARD']?.weightFactor || 1),
                            )}{' '}
                            kg / chiếc
                            {item.quantity > 1
                              ? ` (Tổng: ~${Math.round((item.baseWeightKg || item.baseWeight || BASE_WEIGHTS[item.catalogItemCode] || 30) * (MATERIAL_FACTORS[item.material || 'STANDARD']?.weightFactor || 1)) * item.quantity} kg)`
                              : ''}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Card>
                );
              })}

              {/* Live Estimated Range Floating/Summary Bar at Step 1 */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  backgroundColor: '#f0f9ff',
                  border: '1.5px solid #bae6fd',
                  boxShadow: '0 2px 8px rgba(14, 165, 233, 0.08)',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#0369a1', fontWeight: 700 }}>
                      Khoảng giá dự toán:{' '}
                      <span style={{ color: '#0284c7', fontWeight: 800 }}>
                        {formatCurrency(minVnd)} – {formatCurrency(maxVnd)}
                      </span>
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600, mt: 0.3 }}>
                      Tạm tính:{' '}
                      <span style={{ color: '#16a34a', fontWeight: 800 }}>
                        {formatCurrency(depositHoldVnd)}
                      </span>
                      <span style={{ color: '#64748b', fontWeight: 400, marginLeft: 8 }}>
                        (Ước tính tải: ~{totalEstimatedWeightKg} kg)
                      </span>
                    </Typography>
                  </Box>
                  <Chip
                    label="🛡️ Cam kết dung sai ±15% không phát sinh phí"
                    size="small"
                    sx={{
                      backgroundColor: '#ffffff',
                      color: '#0284c7',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      borderColor: '#38bdf8',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      py: 1.5,
                    }}
                  />
                </Box>
              </Box>
            </Stack>
          )}

          {/* STEP 1: Location and Logistics Handling */}
          {activeStep === 1 && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a' }}>
                  2. Địa điểm & Điều kiện bốc xếp
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Cung cấp địa chỉ thu gom, ngày hẹn và điều kiện tiếp cận để đội xe sắp xếp nhân
                  lực bốc xếp phù hợp.
                </Typography>
              </Box>

              <FormControl fullWidth error={Boolean(errors.serviceLocationId)}>
                <FormLabel
                  htmlFor="service-location-select"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    textAlign: 'left',
                    display: 'block',
                  }}
                >
                  Địa điểm thu gom *
                </FormLabel>
                <Select
                  id="service-location-select"
                  inputProps={{ 'data-testid': 'service-location-input' }}
                  value={formData.serviceLocationId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, serviceLocationId: e.target.value }))
                  }
                  sx={{
                    borderRadius: 2,
                    backgroundColor: '#ffffff',
                    '& .MuiSelect-select': { py: 1.5, px: 2, color: '#0f172a', fontWeight: 500 },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                  }}
                >
                  {serviceLocations.map((loc) => (
                    <MenuItem key={loc.id} value={loc.id}>
                      📍 {loc.address} (Khu vực: {loc.serviceArea?.code || 'Tiêu chuẩn'})
                    </MenuItem>
                  ))}
                </Select>
                {errors.serviceLocationId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.serviceLocationId}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth error={Boolean(errors.requestedDate)}>
                <FormLabel
                  htmlFor="requested-date-input"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    textAlign: 'left',
                    display: 'block',
                  }}
                >
                  Ngày thu gom mong muốn *
                </FormLabel>
                <TextField
                  id="requested-date-input"
                  type="date"
                  fullWidth
                  value={formData.requestedDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, requestedDate: e.target.value }))
                  }
                  error={Boolean(errors.requestedDate)}
                  helperText={errors.requestedDate}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: '#ffffff',
                    '& .MuiInputBase-input': { py: 1.5, px: 2, color: '#0f172a', fontWeight: 500 },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                  }}
                />

                {/* Quick Date Selectors */}
                <Box
                  sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
                >
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Gợi ý chọn nhanh:
                  </Typography>
                  <Chip
                    label="Ngày mai (+1 ngày)"
                    size="small"
                    onClick={() => setQuickDate(1)}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      '&:hover': { backgroundColor: '#e2e8f0' },
                    }}
                  />
                  <Chip
                    label="Ngày kia (+2 ngày)"
                    size="small"
                    onClick={() => setQuickDate(2)}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      '&:hover': { backgroundColor: '#e2e8f0' },
                    }}
                  />
                  <Chip
                    label="3 ngày tới (+3 ngày)"
                    size="small"
                    onClick={() => setQuickDate(3)}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      '&:hover': { backgroundColor: '#e2e8f0' },
                    }}
                  />
                </Box>
              </FormControl>

              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <strong>Quy tắc thời hạn cắt 24h:</strong> Đặt lịch trước thời điểm thu gom 24 giờ
                để đơn được duyệt tự động và bố trí xe gom ngay lập tức.
              </Alert>

              <Divider sx={{ my: 0.5 }} />

              <FormControl fullWidth>
                <FormLabel
                  htmlFor="placement-select"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    textAlign: 'left',
                    display: 'block',
                  }}
                >
                  Vị trí đặt đồ
                </FormLabel>
                <Select
                  id="placement-select"
                  value={formData.handlingConditions.placement}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      handlingConditions: { ...prev.handlingConditions, placement: e.target.value },
                    }))
                  }
                  sx={{
                    borderRadius: 2,
                    backgroundColor: '#ffffff',
                    '& .MuiSelect-select': { py: 1.5, px: 2, color: '#0f172a', fontWeight: 500 },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                  }}
                >
                  <MenuItem value="CURBSIDE" sx={{ color: '#0f172a' }}>
                    🛣️ Vỉa hè / Mặt đường (Xe tải bốc trực tiếp)
                  </MenuItem>
                  <MenuItem value="GROUND_FLOOR" sx={{ color: '#0f172a' }}>
                    🏠 Tầng trệt trong nhà (Bê vác nhẹ)
                  </MenuItem>
                  <MenuItem value="UPPER_FLOOR" sx={{ color: '#0f172a' }}>
                    🏢 Tầng lầu / Chung cư (Cầu thang / Thang máy)
                  </MenuItem>
                </Select>
              </FormControl>

              {formData.handlingConditions.placement === 'UPPER_FLOOR' && (
                <Stack
                  spacing={2}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <FormControl fullWidth error={Boolean(errors.floorNumber)}>
                    <FormLabel
                      htmlFor="floor-number-input"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        color: '#0f172a',
                        fontSize: '0.9rem',
                        textAlign: 'left',
                        display: 'block',
                      }}
                    >
                      Số tầng lầu
                    </FormLabel>
                    <TextField
                      id="floor-number-input"
                      type="number"
                      value={formData.handlingConditions.floorNumber}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setFormData((prev) => ({
                          ...prev,
                          handlingConditions: { ...prev.handlingConditions, floorNumber: val },
                        }));
                      }}
                      error={Boolean(errors.floorNumber)}
                      helperText={errors.floorNumber}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: '#ffffff',
                        '& .MuiInputBase-input': {
                          py: 1.2,
                          px: 2,
                          color: '#0f172a',
                          fontWeight: 500,
                        },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                      }}
                    />
                  </FormControl>
                  <FormControlLabel
                    sx={{ '& .MuiFormControlLabel-label': { color: '#0f172a', fontWeight: 500 } }}
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
                    label="Tòa nhà có thang máy vận chuyển"
                  />
                </Stack>
              )}

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <FormControlLabel
                  sx={{ '& .MuiFormControlLabel-label': { color: '#0f172a', fontWeight: 500 } }}
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
                  label="Cần tháo dỡ linh kiện (ví dụ: tháo cánh tủ, tháo chân bàn)"
                />
              </Box>
            </Stack>
          )}

          {/* STEP 2: Review and Submit */}
          {activeStep === 2 && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a' }}>
                  3. Xem lại & Báo giá minh bạch
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Kiểm tra toàn bộ thông tin đơn đặt lịch trước khi hệ thống tạo bảng tính giá.
                </Typography>
              </Box>

              {/* Booking Review Ticket */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2.5,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                }}
              >
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      pb: 1,
                      borderBottom: '1px dashed #cbd5e1',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      📅 Ngày hẹn thu gom:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
                      {formData.requestedDate || 'Chưa chọn'}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      pb: 1,
                      borderBottom: '1px dashed #cbd5e1',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      📍 Địa điểm phục vụ:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        color: '#0f172a',
                        textAlign: 'right',
                        maxWidth: 360,
                      }}
                    >
                      {serviceLocations.find((l) => l.id === formData.serviceLocationId)?.address ||
                        formData.serviceLocationId ||
                        'Chưa cập nhật'}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      pb: 1,
                      borderBottom: '1px dashed #cbd5e1',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      📦 Danh mục đồ đạc:
                    </Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      {formData.confirmedItems.map((item, i) => {
                        const visual = getItemVisual(item);
                        const mat = item.material || 'STANDARD';
                        const matObj = MATERIAL_FACTORS[mat] || MATERIAL_FACTORS.STANDARD;
                        return (
                          <Box key={i} sx={{ mb: 1, '&:last-child': { mb: 0 } }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 'bold', color: '#0f172a' }}
                            >
                              {visual.icon} {item.quantity}x{' '}
                              {item.displayName || visual.label || item.catalogItemCode}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: '#64748b', display: 'block' }}
                            >
                              Chất liệu: <strong>{matObj.label}</strong>
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      🚛 Điều kiện bốc xếp:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
                      {formData.handlingConditions.placement === 'CURBSIDE'
                        ? 'Vỉa hè / Mặt đường'
                        : formData.handlingConditions.placement === 'GROUND_FLOOR'
                          ? 'Tầng trệt trong nhà'
                          : `Tầng ${formData.handlingConditions.floorNumber} (${formData.handlingConditions.hasLift ? 'Có thang máy' : 'Thang bộ'})`}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* 2-Tiered Quote Review Box */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                }}
              >
                <Stack spacing={1.5}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 600 }}>
                      📊 Khoảng giá dự toán toàn đơn:
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: '#1d4ed8', fontWeight: 800 }}>
                      {formatCurrency(minVnd)} – {formatCurrency(maxVnd)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 0.5, borderColor: '#e2e8f0' }} />
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ color: '#0f172a', fontWeight: 700 }}>
                        💳 Số tiền tạm giữ chỗ:
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        (Thanh toán trước để điều phối xe, quyết toán theo nghiệm thu bàn giao)
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ color: '#16a34a', fontWeight: 800 }}>
                      {formatCurrency(depositHoldVnd)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Transparency Guarantee Banner */}
              <Alert
                severity="success"
                sx={{
                  borderRadius: 2,
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  '& .MuiAlert-icon': { color: '#16a34a' },
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#166534' }}>
                  🛡️ Cam kết Nghiệm thu & Dung sai Minh bạch Smartbin:
                </Typography>
                <Typography variant="body2" sx={{ color: '#15803d', mt: 0.5 }}>
                  Tài xế sẽ kiểm tra nhanh chất liệu và kích thước khi nhận đồ. Nếu sai lệch thực tế
                  nằm trong ngưỡng <strong>±15%</strong>, đơn hàng giữ nguyên mức thanh toán tạm
                  tính ban đầu, tuyệt đối không phụ thu phát sinh.
                </Typography>
              </Alert>
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            color: '#64748b',
            borderRadius: 2,
            px: 2.5,
            py: 1,
            '&:hover': { backgroundColor: '#f1f5f9' },
          }}
        >
          ← Quay lại
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          sx={{
            backgroundColor: '#1d4ed8',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: 2,
            px: 3,
            py: 1.2,
            boxShadow: '0 4px 6px -1px rgba(29, 78, 216, 0.2)',
            '&:hover': { backgroundColor: '#1e40af' },
          }}
        >
          {activeStep === STEPS.length - 1 ? 'Xác nhận & Gửi yêu cầu' : 'Tiếp theo →'}
        </Button>
      </Box>
    </Box>
  );
}

export default BulkyRequestWizard;
