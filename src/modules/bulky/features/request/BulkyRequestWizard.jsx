import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
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
  IconButton,
} from '@mui/material';
import {
  validateRequestItems,
  validateCanProceedToQuote,
  validateStepLogistics,
} from './requestValidation.js';
import { ACCEPTED_ITEM_TYPES, MATERIAL_TYPES, MATERIAL_FACTORS } from '../../domain/constants.js';
import {
  SofaIcon,
  BedIcon,
  CabinetIcon,
  TableIcon,
  BoxIcon,
  CameraIcon,
  SparklesIcon,
  MapPinIcon,
  CalendarIcon,
  TruckIcon,
  BuildingIcon,
  HomeIcon,
  RoadIcon,
  ElevatorIcon,
  WrenchIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  getItemSvgIcon,
} from '../../components/BulkyIcons.jsx';
import BulkyImageBoundingBoxOverlay from '../../components/BulkyImageBoundingBoxOverlay.jsx';

const STEPS = [
  { id: 0, label: 'Chụp ảnh & AI quét đồ trực tiếp' },
  { id: 1, label: 'Địa điểm & Điều kiện bốc xếp' },
  { id: 2, label: 'Xem lại & Báo giá minh bạch' },
];

const ITEM_TYPE_INFO = {
  SOFA: { label: 'Sofa / Ghế salon', icon: <SofaIcon size={18} /> },
  MATTRESS: { label: 'Nệm / Giường ngủ', icon: <BedIcon size={18} /> },
  CABINET: { label: 'Tủ / Kệ các loại', icon: <CabinetIcon size={18} /> },
  TABLE: { label: 'Bàn / Ghế các loại', icon: <TableIcon size={18} /> },
  OTHER: { label: 'Đồ cồng kềnh khác', icon: <BoxIcon size={18} /> },
};

const BASE_WEIGHTS = {
  SOFA: 45,
  MATTRESS: 30,
  CABINET: 40,
  TABLE: 20,
  OTHER: 15,
};

const BASE_ITEM_PRICES = {
  SOFA: 150000,
  MATTRESS: 120000,
  CABINET: 100000,
  TABLE: 80000,
  OTHER: 60000,
};

function calculateItemEstimatedWeightKg(item) {
  const base = item.baseWeightKg || item.baseWeight || BASE_WEIGHTS[item.catalogItemCode] || 30;
  const factor = MATERIAL_FACTORS[item.material || 'STANDARD']?.weightFactor || 1;
  return Math.round(base * factor);
}

function formatCurrency(vnd) {
  return `${(vnd || 0).toLocaleString('vi-VN')} đ`;
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
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);

  const tomorrowDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    serviceLocationId: initialDraft?.serviceLocation?.id || initialDraft?.serviceLocationId || (serviceLocations?.[0]?.id || ''),
    requestedDate: initialDraft?.requestedDate || tomorrowDateStr(),
    imageMetadata: initialDraft?.imageMetadata || [],
    confirmedItems: initialDraft?.confirmedItems?.length
      ? initialDraft.confirmedItems
      : [
          {
            catalogItemCode: 'SOFA',
            displayName: 'Sofa da 3 chỗ',
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

  useEffect(() => {
    if (!formData.serviceLocationId && serviceLocations && serviceLocations.length > 0) {
      setFormData((prev) => ({
        ...prev,
        serviceLocationId: prev.serviceLocationId || serviceLocations[0].id,
      }));
    }
  }, [serviceLocations]);

  // Mẫu ảnh chụp sẵn để kiểm thử nhanh
  const samplePresets = [
    {
      name: 'Sofa da phòng khách',
      icon: <SofaIcon size={16} />,
      meta: {
        filename: 'sofa_da_phong_khach.jpg',
        sizeBytes: 1024 * 380,
        mimeType: 'image/jpeg',
        dataUrl:
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop',
        boxes: [
          {
            box_2d: [180, 120, 850, 910],
            displayName: 'Sofa da 3 chỗ phòng khách',
            confidence: 0.96,
            itemType: 'SOFA',
            isHazardous: false,
            suggestedMaterial: 'STANDARD',
          },
        ],
      },
    },
    {
      name: 'Nệm lò xo đôi',
      icon: <BedIcon size={16} />,
      meta: {
        filename: 'nem_lo_xo_1m8.jpg',
        sizeBytes: 1024 * 450,
        mimeType: 'image/jpeg',
        dataUrl:
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop',
        boxes: [
          {
            box_2d: [150, 100, 880, 900],
            displayName: 'Nệm lò xo King Size 1m8 x 2m',
            confidence: 0.94,
            itemType: 'MATTRESS',
            isHazardous: false,
            suggestedMaterial: 'STANDARD',
          },
        ],
      },
    },
    {
      name: 'Tủ quần áo gỗ',
      icon: <CabinetIcon size={16} />,
      meta: {
        filename: 'tu_go_3_canh.jpg',
        sizeBytes: 1024 * 620,
        mimeType: 'image/jpeg',
        dataUrl:
          'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop',
        boxes: [
          {
            box_2d: [100, 150, 920, 850],
            displayName: 'Tủ quần áo gỗ 3 cánh',
            confidence: 0.91,
            itemType: 'CABINET',
            isHazardous: false,
            suggestedMaterial: 'HEAVY',
          },
        ],
      },
    },
  ];

  const handleAddPresetPhoto = (presetMeta) => {
    setFormData((prev) => {
      const nextMeta = [...prev.imageMetadata, presetMeta];
      let nextItems = [...prev.confirmedItems];
      if (presetMeta.boxes && presetMeta.boxes.length > 0 && !nextItems[0]?.box_2d) {
        nextItems = nextItems.map((it, idx) => {
          if (idx === 0) {
            return {
              ...it,
              box_2d: presetMeta.boxes[0].box_2d,
              confidence: presetMeta.boxes[0].confidence,
              displayName: it.displayName || presetMeta.boxes[0].displayName,
            };
          }
          return it;
        });
      }
      return {
        ...prev,
        imageMetadata: nextMeta,
        confirmedItems: nextItems,
      };
    });
    if (errors.images) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.images;
        return next;
      });
    }
  };

  const handleRemovePhoto = (index) => {
    setSelectedBoxIndex(null);
    setFormData((prev) => ({
      ...prev,
      imageMetadata: prev.imageMetadata.filter((_, i) => i !== index),
    }));
  };

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
      });
      setAiResult(res);
      if (res?.items && res.items.length > 0) {
        const hasDisassemblyNeeded = res.items.some((it) => it.disassemblyNeeded);
        setFormData((prev) => ({
          ...prev,
          confirmedItems: res.items.map((item) => {
            const material = item.suggestedMaterial || 'STANDARD';
            const baseWeight =
              item.baseWeightKg ||
              item.baseWeight ||
              BASE_WEIGHTS[item.catalogItemCode || item.itemType] ||
              30;
            const weightFactor = MATERIAL_FACTORS[material]?.weightFactor || 1;
            const estimatedWeightKg = Math.round(baseWeight * weightFactor);

            return {
              catalogItemCode: item.catalogItemCode || item.itemType || 'OTHER',
              displayName: item.displayName || item.itemType,
              quantity: item.suggestedQuantity || 1,
              dimensionsCm: item.dimensionsCm || { length: 150, width: 80, height: 80 },
              material,
              estimatedWeightKg,
              box_2d: item.box_2d,
              confidence: item.confidence,
            };
          }),
          handlingConditions: {
            ...prev.handlingConditions,
            requiresDisassembly: hasDisassemblyNeeded || prev.handlingConditions.requiresDisassembly,
          },
        }));
      }
    } catch {
      setErrors({ ai: 'Có lỗi xảy ra khi gọi AI nhận diện' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentBoxes =
    aiResult?.boundingBoxes?.length > 0
      ? aiResult.boundingBoxes
      : formData.confirmedItems?.some((it) => it.box_2d)
      ? formData.confirmedItems
          .filter((it) => it.box_2d)
          .map((it) => ({
            box_2d: it.box_2d,
            displayName: it.displayName,
            confidence: it.confidence,
            itemType: it.catalogItemCode || it.itemType,
            suggestedMaterial: it.material,
          }))
      : formData.imageMetadata?.[0]?.boxes?.length > 0
      ? formData.imageMetadata[0].boxes
      : [];


  return (
    <Box sx={{ width: '100%', maxWidth: 740, mx: 'auto' }}>
      {isOffline && (
        <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
          Chế độ ngoại tuyến — Bản nháp lưu cục bộ trên máy.
        </Alert>
      )}

      {/* Modern Segmented Progress Bar */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          mb: 3.5,
          p: 0.6,
          backgroundColor: '#f1f5f9',
          borderRadius: 3,
        }}
      >
        {STEPS.map((step) => {
          const isCurrent = activeStep === step.id;
          const isPassed = activeStep > step.id;
          return (
            <Box
              key={step.id}
              onClick={() => {
                if (isPassed) setActiveStep(step.id);
              }}
              sx={{
                py: 1,
                px: 1.5,
                borderRadius: 2.5,
                textAlign: 'center',
                cursor: isPassed ? 'pointer' : 'default',
                backgroundColor: isCurrent ? '#ffffff' : 'transparent',
                boxShadow: isCurrent ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Typography
                variant="body2"
                fontWeight={isCurrent ? 700 : 500}
                sx={{
                  color: isCurrent ? '#1d4ed8' : isPassed ? '#0f172a' : '#64748b',
                  fontSize: '0.825rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {step.id + 1}. {step.label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Main Content Card */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          backgroundColor: '#ffffff',
          overflow: 'visible',
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          {/* BƯỚC 1: ẢNH & ĐỒ VẬT */}
          {activeStep === 0 && (
            <Stack spacing={3}>
              <Typography sx={{ display: 'none' }}>Ảnh đồ vật & AI Quét</Typography>
              {/* Dropzone Upload */}
              <Box
                component="label"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 3.5,
                  px: 2,
                  borderRadius: 3,
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
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.2,
                  }}
                >
                  <CameraIcon size={24} />
                </Box>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0f172a', fontSize: '0.95rem' }}>
                  Chụp ảnh hoặc tải lên đồ cồng kềnh
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', mt: 0.3 }}>
                  Định dạng JPG, PNG, WebP (Tối đa 10MB)
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
                <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                  {errors.images}
                </Typography>
              )}

              {/* Fast Presets */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Thử nhanh:
                </Typography>
                {samplePresets.map((preset, idx) => (
                  <Chip
                    key={idx}
                    component="button"
                    icon={preset.icon}
                    label={preset.name}
                    size="small"
                    onClick={() => handleAddPresetPhoto(preset.meta)}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      fontWeight: 500,
                      borderRadius: 2,
                      border: 'none',
                      '&:hover': { backgroundColor: '#e2e8f0', color: '#1d4ed8' },
                    }}
                  />
                ))}
              </Box>

              {/* Photos List Preview */}
              {formData.imageMetadata.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 1 }}>
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
                                width: 22,
                                height: 22,
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
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          fontWeight: 500,
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Bounding Box AI Overlay */}
              {formData.imageMetadata.length > 0 && (
                <Box sx={{ width: '100%', mt: 0.5 }}>
                  <BulkyImageBoundingBoxOverlay
                    image={formData.imageMetadata[0]}
                    boxes={currentBoxes}
                    selectedBoxIndex={selectedBoxIndex}
                    onSelectBox={setSelectedBoxIndex}
                  />
                </Box>
              )}


              {/* AI Action Banner */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  borderRadius: 2.5,
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 2,
                      backgroundColor: '#dcfce7',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SparklesIcon size={18} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#166534', fontWeight: 700 }}>
                      Trợ lý AI Phân Loại
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#15803d', display: 'block' }}>
                      Tự động nhận diện đồ vật &amp; đo kích thước ước tính
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  disabled={isAnalyzing}
                  onClick={handleRunAi}
                  startIcon={isAnalyzing ? <CircularProgress size={16} color="inherit" /> : <SparklesIcon size={16} />}
                  sx={{
                    backgroundColor: '#16a34a',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2.2,
                    py: 0.7,
                    boxShadow: 'none',
                    '&:hover': { backgroundColor: '#15803d', boxShadow: 'none' },
                  }}
                >
                  {isAnalyzing ? 'Đang quét...' : 'Quét với AI'}
                </Button>
              </Box>

              {errors.ai && <Alert severity="error">{errors.ai}</Alert>}

              {aiResult && (
                <Box>
                  {aiResult.containsHazardousWaste ? (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                      Phát hiện rác không thuộc danh mục: <strong>{aiResult.hazardousReason || 'Chất cấm'}</strong>. Đơn cần xem xét thủ công.
                    </Alert>
                  ) : (
                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                      ✓ Đã nhận diện đồ vật và tự động điền danh mục bên dưới.
                    </Alert>
                  )}
                </Box>
              )}

              <Divider sx={{ my: 0.5 }} />

              {/* Items List Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0f172a' }}>
                  Danh mục ({formData.confirmedItems.length} món)
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PlusIcon size={15} />}
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
                        },
                      ],
                    }))
                  }
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#e2e8f0',
                    color: '#1d4ed8',
                    '&:hover': { borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
                  }}
                >
                  Thêm đồ khác
                </Button>
              </Box>

              {errors.quoteCheck && <Alert severity="error">{errors.quoteCheck}</Alert>}
              {errors.confirmedItems && <Alert severity="error">{errors.confirmedItems}</Alert>}

              {/* Items Cards */}
              <Stack spacing={2}>
                {formData.confirmedItems.map((item, idx) => (
                  <Card
                    key={idx}
                    variant="outlined"
                    data-testid={`confirmed-item-card-${idx}`}
                    onMouseEnter={() => setSelectedBoxIndex(idx)}
                    onMouseLeave={() => setSelectedBoxIndex(null)}
                    sx={{
                      p: 2.5,
                      borderRadius: 2.5,
                      backgroundColor: selectedBoxIndex === idx ? '#f8faff' : '#ffffff',
                      borderColor: selectedBoxIndex === idx ? '#1d4ed8' : '#e2e8f0',
                      boxShadow:
                        selectedBoxIndex === idx
                          ? '0 0 0 2px rgba(29, 78, 216, 0.15)'
                          : 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: selectedBoxIndex === idx ? '#1d4ed8' : '#cbd5e1',
                      },
                    }}
                  >
                    <Stack spacing={2}>
                      {/* Item Top Row */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2.5,
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            shrink: 0,
                          }}
                        >
                          {getItemSvgIcon(item, 22)}
                        </Box>
                        <Box sx={{ flex: 1 }}>
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
                            placeholder="Tên đồ vật (ví dụ: Sofa da, Nệm đôi...)"
                            sx={{
                              '& .MuiInputBase-input': { py: 0.9, px: 1.2, color: '#0f172a', fontWeight: 600 },
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                            }}
                          />
                        </Box>
                        {formData.confirmedItems.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedBoxIndex(null);
                              setFormData((prev) => ({
                                ...prev,
                                confirmedItems: prev.confirmedItems.filter((_, i) => i !== idx),
                              }));
                            }}
                            sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}
                          >
                            <TrashIcon size={18} />
                          </IconButton>
                        )}
                      </Box>


                      {/* Item Controls Row */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.4fr 1fr' }, gap: 2, alignItems: 'center' }}>
                        {/* Category Selector */}
                        <FormControl size="small" fullWidth>
                          <Select
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
                              '& .MuiSelect-select': { py: 0.9, color: '#0f172a', fontWeight: 500 },
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                            }}
                          >
                            {ACCEPTED_ITEM_TYPES.map((type) => (
                              <MenuItem key={type} value={type} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {ITEM_TYPE_INFO[type]?.icon}
                                <span>{ITEM_TYPE_INFO[type]?.label || type}</span>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        {/* Quantity Counter */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 1 }}>
                          <Typography variant="body2" sx={{ color: '#64748b', mr: 0.5 }}>
                            Số lượng:
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 32, height: 32, p: 0, borderColor: '#e2e8f0', color: '#0f172a' }}
                            onClick={() => {
                              setFormData((prev) => {
                                const nextItems = [...prev.confirmedItems];
                                nextItems[idx].quantity = Math.max(1, (nextItems[idx].quantity || 1) - 1);
                                return { ...prev, confirmedItems: nextItems };
                              });
                            }}
                          >
                            <MinusIcon size={14} />
                          </Button>
                          <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 32, height: 32, p: 0, borderColor: '#e2e8f0', color: '#0f172a' }}
                            onClick={() => {
                              setFormData((prev) => {
                                const nextItems = [...prev.confirmedItems];
                                nextItems[idx].quantity = (nextItems[idx].quantity || 1) + 1;
                                return { ...prev, confirmedItems: nextItems };
                              });
                            }}
                          >
                            <PlusIcon size={14} />
                          </Button>
                        </Box>
                      </Box>

                      {/* Dimensions Row */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, pt: 0.5 }}>
                        <TextField
                          size="small"
                          label="Dài (cm)"
                          type="number"
                          value={item.dimensionsCm?.length || 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFormData((prev) => {
                              const nextItems = [...prev.confirmedItems];
                              nextItems[idx].dimensionsCm = { ...nextItems[idx].dimensionsCm, length: val };
                              return { ...prev, confirmedItems: nextItems };
                            });
                          }}
                          sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}
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
                              nextItems[idx].dimensionsCm = { ...nextItems[idx].dimensionsCm, width: val };
                              return { ...prev, confirmedItems: nextItems };
                            });
                          }}
                          sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}
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
                              nextItems[idx].dimensionsCm = { ...nextItems[idx].dimensionsCm, height: val };
                              return { ...prev, confirmedItems: nextItems };
                            });
                          }}
                          sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}
                        />
                      </Box>

                      {/* 1-Click Material Survey Chips */}
                      <Box sx={{ pt: 1.5, borderTop: '1px dashed #e2e8f0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                            Chất liệu chế tạo & Trọng lượng ước tính:
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 700 }}>
                            ~{calculateItemEstimatedWeightKg(item)} kg / chiếc
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                          {Object.values(MATERIAL_FACTORS).map((mat) => {
                            const isSelected = (item.material || MATERIAL_TYPES.STANDARD) === mat.code;
                            return (
                              <Chip
                                key={mat.code}
                                label={mat.label}
                                size="small"
                                onClick={() => {
                                  setFormData((prev) => {
                                    const nextItems = [...prev.confirmedItems];
                                    nextItems[idx] = {
                                      ...nextItems[idx],
                                      material: mat.code,
                                      estimatedWeightKg: calculateItemEstimatedWeightKg({
                                        ...nextItems[idx],
                                        material: mat.code,
                                      }),
                                    };
                                    return { ...prev, confirmedItems: nextItems };
                                  });
                                }}
                                color={isSelected ? 'primary' : 'default'}
                                variant={isSelected ? 'filled' : 'outlined'}
                                sx={{
                                  cursor: 'pointer',
                                  fontWeight: isSelected ? 700 : 500,
                                  borderRadius: 1.5,
                                  ...(isSelected
                                    ? { backgroundColor: '#1d4ed8', color: '#ffffff' }
                                    : { borderColor: '#cbd5e1', color: '#475569' }),
                                }}
                              />
                            );
                          })}
                        </Stack>
                      </Box>
                    </Stack>
                  </Card>
                ))}
              </Stack>

              {/* Live Floating Range Summary Bar at Step 0 */}
              {formData.confirmedItems.length > 0 && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    backgroundColor: '#eff6ff',
                    border: '1.5px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                      Khoảng giá dự toán (Dựa trên vật liệu & thể tích):
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#1d4ed8', fontWeight: 800 }}>
                      {formatCurrency(minVnd)} – {formatCurrency(maxVnd)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Giữ chỗ ước tính:
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: '#16a34a', fontWeight: 700 }}>
                      {formatCurrency(depositHoldVnd)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>
          )}

          {/* BƯỚC 2: ĐỊA ĐIỂM & ĐIỀU KIỆN BỐC XẾP */}
          {activeStep === 1 && (
            <Stack spacing={3}>
              {/* Location Select */}
              <FormControl fullWidth error={Boolean(errors.serviceLocationId)}>
                <FormLabel sx={{ fontWeight: 600, mb: 1, color: '#0f172a', fontSize: '0.875rem' }}>
                  Địa điểm thu gom
                </FormLabel>
                <Select
                  inputProps={{ 'data-testid': 'service-location-input' }}
                  value={formData.serviceLocationId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, serviceLocationId: e.target.value }))}
                  sx={{
                    borderRadius: 2,
                    '& .MuiSelect-select': { py: 1.2, color: '#0f172a', fontWeight: 500 },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                  }}
                >
                  {serviceLocations.map((loc) => (
                    <MenuItem key={loc.id} value={loc.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MapPinIcon size={16} color="#1d4ed8" />
                      <span>{loc.address}</span>
                    </MenuItem>
                  ))}
                </Select>
                {errors.serviceLocationId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, fontWeight: 500 }}>
                    {errors.serviceLocationId}
                  </Typography>
                )}
              </FormControl>

              {/* Date Select */}
              <FormControl fullWidth error={Boolean(errors.requestedDate)}>
                <FormLabel htmlFor="requested-date-input" sx={{ fontWeight: 600, mb: 1, color: '#0f172a', fontSize: '0.875rem' }}>
                  Ngày thu gom mong muốn
                </FormLabel>
                <TextField
                  id="requested-date-input"
                  label="Ngày thu gom mong muốn"
                  inputProps={{ 'aria-label': 'Ngày thu gom mong muốn' }}
                  type="date"
                  fullWidth
                  value={formData.requestedDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, requestedDate: e.target.value }))}
                  error={Boolean(errors.requestedDate)}
                  helperText={errors.requestedDate}
                  sx={{
                    '& .MuiInputBase-input': { py: 1.2, color: '#0f172a', fontWeight: 500 },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                  }}
                />
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label="Ngày mai" size="small" onClick={() => setQuickDate(1)} sx={{ cursor: 'pointer', borderRadius: 2 }} />
                  <Chip label="Ngày kia" size="small" onClick={() => setQuickDate(2)} sx={{ cursor: 'pointer', borderRadius: 2 }} />
                  <Chip label="+3 ngày" size="small" onClick={() => setQuickDate(3)} sx={{ cursor: 'pointer', borderRadius: 2 }} />
                </Box>
              </FormControl>

              <Divider sx={{ my: 0.5 }} />

              {/* Visual Placement Cards */}
              <Box>
                <FormLabel sx={{ fontWeight: 600, mb: 1.5, color: '#0f172a', fontSize: '0.875rem', display: 'block' }}>
                  Vị trí để đồ vật
                </FormLabel>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
                  {[
                    { id: 'CURBSIDE', title: 'Mặt đường / Vỉa hè', sub: 'Xe tải bốc ngay', icon: <RoadIcon size={22} /> },
                    { id: 'GROUND_FLOOR', title: 'Tầng trệt trong nhà', sub: 'Bê vác nhẹ', icon: <HomeIcon size={22} /> },
                    { id: 'UPPER_FLOOR', title: 'Tầng lầu / Chung cư', sub: 'Cần vận chuyển lầu', icon: <BuildingIcon size={22} /> },
                  ].map((p) => {
                    const isSelected = formData.handlingConditions.placement === p.id;
                    return (
                      <Card
                        key={p.id}
                        variant="outlined"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            handlingConditions: { ...prev.handlingConditions, placement: p.id },
                          }))
                        }
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          textAlign: 'center',
                          cursor: 'pointer',
                          borderColor: isSelected ? '#1d4ed8' : '#e2e8f0',
                          backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                          transition: 'all 0.2s ease',
                          '&:hover': { borderColor: '#1d4ed8' },
                        }}
                      >
                        <Box sx={{ color: isSelected ? '#1d4ed8' : '#64748b', mb: 1 }}>{p.icon}</Box>
                        <Typography variant="body2" fontWeight={isSelected ? 700 : 600} sx={{ color: '#0f172a', fontSize: '0.825rem' }}>
                          {p.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.2 }}>
                          {p.sub}
                        </Typography>
                      </Card>
                    );
                  })}
                </Box>
              </Box>

              {/* Extra upper floor options */}
              {formData.handlingConditions.placement === 'UPPER_FLOOR' && (
                <Stack spacing={2} sx={{ p: 2, borderRadius: 2.5, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <TextField
                    label="Số tầng lầu"
                    type="number"
                    size="small"
                    value={formData.handlingConditions.floorNumber}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setFormData((prev) => ({
                        ...prev,
                        handlingConditions: { ...prev.handlingConditions, floorNumber: val },
                      }));
                    }}
                    sx={{ width: 140, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.handlingConditions.hasLift}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            handlingConditions: { ...prev.handlingConditions, hasLift: e.target.checked },
                          }))
                        }
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ElevatorIcon size={18} color="#1d4ed8" />
                        <Typography variant="body2" fontWeight={500}>
                          Có thang máy vận chuyển
                        </Typography>
                      </Box>
                    }
                  />
                </Stack>
              )}

              {/* Disassembly Switch */}
              <Box sx={{ p: 2, borderRadius: 2.5, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.handlingConditions.requiresDisassembly}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          handlingConditions: { ...prev.handlingConditions, requiresDisassembly: e.target.checked },
                        }))
                      }
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WrenchIcon size={18} color="#1d4ed8" />
                      <Typography variant="body2" fontWeight={500}>
                        Yêu cầu tháo dỡ linh kiện (tháo chân bàn, tháo cánh tủ...)
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Stack>
          )}

          {/* BƯỚC 3: XEM LẠI & BÁO GIÁ */}
          {activeStep === 2 && (
            <Stack spacing={2.5}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2.5,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                    <CalendarIcon size={18} color="#1d4ed8" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        Ngày hẹn thu gom
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#0f172a' }}>
                        {formData.requestedDate || 'Chưa chọn'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                    <MapPinIcon size={18} color="#1d4ed8" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        Điểm thu gom
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#0f172a' }}>
                        {serviceLocations.find((l) => l.id === formData.serviceLocationId)?.address || formData.serviceLocationId || 'Địa chỉ tiêu chuẩn'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                    <TruckIcon size={18} color="#1d4ed8" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        Điều kiện tiếp cận
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#0f172a' }}>
                        {formData.handlingConditions.placement === 'CURBSIDE'
                          ? 'Mặt đường / Vỉa hè'
                          : formData.handlingConditions.placement === 'GROUND_FLOOR'
                            ? 'Tầng trệt trong nhà'
                            : `Tầng ${formData.handlingConditions.floorNumber} (${formData.handlingConditions.hasLift ? 'Có thang máy' : 'Thang bộ'})`}
                        {formData.handlingConditions.requiresDisassembly ? ' • Cần tháo dỡ' : ''}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <BoxIcon size={18} color="#1d4ed8" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>
                        Danh mục ({formData.confirmedItems.length} món)
                      </Typography>
                      {formData.confirmedItems.map((item, i) => {
                        const mat = item.material || MATERIAL_TYPES.STANDARD;
                        const matObj = MATERIAL_FACTORS[mat] || MATERIAL_FACTORS.STANDARD;
                        return (
                          <Box key={i} sx={{ py: 0.5, borderBottom: i < formData.confirmedItems.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getItemSvgIcon(item, 16, '#64748b')}
                              <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>
                                {item.quantity}x {item.displayName || item.catalogItemCode}
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748b', ml: 3, display: 'block' }}>
                              Chất liệu: <strong>{matObj.label}</strong> (~{calculateItemEstimatedWeightKg(item)} kg / chiếc)
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Stack>
              </Box>

              {/* 2-Tiered Quote Review Box */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                }}
              >
                <Stack spacing={1.5}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 600 }}>
                      Khoảng giá dự toán toàn đơn:
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
                        Số tiền tạm giữ chỗ:
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
                  Cam kết Nghiệm thu & Dung sai Minh bạch Smartbin:
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

      {/* Wizard Footer Navigation */}
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
          Quay lại
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          sx={{
            backgroundColor: '#1d4ed8',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: 2,
            px: 3.5,
            py: 1.1,
            boxShadow: 'none',
            '&:hover': { backgroundColor: '#1e40af', boxShadow: 'none' },
          }}
        >
          {activeStep === STEPS.length - 1 ? 'Xác nhận & Gửi yêu cầu' : 'Tiếp theo →'}
        </Button>
      </Box>
    </Box>
  );
}

export default BulkyRequestWizard;
