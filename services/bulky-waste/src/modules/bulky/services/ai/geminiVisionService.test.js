import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeBulkyWasteWithGemini } from './geminiVisionService.js';
import { AI_DECISION } from '../../domain/constants.js';

describe('geminiVisionService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('recognizes preset sofa correctly', async () => {
    const res = await analyzeBulkyWasteWithGemini({
      images: [{ filename: 'sofa_da_phong_khach.jpg' }],
    });
    expect(res.decision).toBe(AI_DECISION.SUGGESTED);
    expect(res.requiresManualReview).toBe(false);
    expect(res.items[0].itemType).toBe('SOFA');
    expect(res.items[0].displayName).toContain('Sofa');
    expect(res.aiModelUsed).toBe('Trí tuệ nhân tạo (AI)');
  });

  it('recognizes preset mattress correctly', async () => {
    const res = await analyzeBulkyWasteWithGemini({
      images: [{ filename: 'nem_lo_xo_1m8.jpg' }],
    });
    expect(res.decision).toBe(AI_DECISION.SUGGESTED);
    expect(res.items[0].itemType).toBe('MATTRESS');
    expect(res.items[0].dimensionsCm.width).toBe(180);
  });

  it('recognizes preset cabinet correctly', async () => {
    const res = await analyzeBulkyWasteWithGemini({
      images: [{ filename: 'tu_go_3_canh.jpg' }],
    });
    expect(res.decision).toBe(AI_DECISION.SUGGESTED);
    expect(res.items[0].itemType).toBe('CABINET');
    expect(res.items[0].disassemblyNeeded).toBe(true);
  });

  it('fallbacks gracefully when no base64 images provided', async () => {
    const res = await analyzeBulkyWasteWithGemini({ images: [] });
    expect(res.decision).toBe(AI_DECISION.SUGGESTED);
    expect(res.items.length).toBeGreaterThan(0);
  });

  it('calls Gemini 2.5 Flash API when base64 is provided and parses response', async () => {
    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  decision: 'SUGGESTED',
                  confidence: 0.95,
                  containsHazardousWaste: false,
                  explanation: 'Đã phát hiện 1 ghế sofa da đôi',
                  items: [
                    {
                      itemType: 'SOFA',
                      displayName: 'Sofa da 2 chỗ',
                      suggestedQuantity: 1,
                      dimensionsCm: { length: 180, width: 85, height: 80 },
                      disassemblyNeeded: false,
                    },
                  ],
                }),
              },
            ],
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGeminiResponse,
    });

    const res = await analyzeBulkyWasteWithGemini({
      images: [
        {
          dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
          filename: 'uploaded_sofa.jpg',
        },
      ],
    });

    expect(global.fetch).toHaveBeenCalled();
    expect(res.decision).toBe(AI_DECISION.SUGGESTED);
    expect(res.items[0].displayName).toBe('Sofa da 2 chỗ');
    expect(res.aiModelUsed).toBe('Trí tuệ nhân tạo (AI)');
  });

  it('flags hazardous waste as MANUAL_REVIEW when detected by Gemini', async () => {
    const mockHazardousResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  decision: 'MANUAL_REVIEW',
                  confidence: 0.98,
                  containsHazardousWaste: true,
                  hazardousReason: 'Phát hiện bình gas mini và thùng chứa hóa chất sơn',
                  explanation: 'Hình ảnh chứa rác nguy hại bị cấm thu gom',
                  items: [],
                }),
              },
            ],
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHazardousResponse,
    });

    const res = await analyzeBulkyWasteWithGemini({
      images: [
        {
          base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          mimeType: 'image/png',
          filename: 'binh_gas.png',
        },
      ],
    });

    expect(res.decision).toBe(AI_DECISION.MANUAL_REVIEW);
    expect(res.requiresManualReview).toBe(true);
    expect(res.containsHazardousWaste).toBe(true);
    expect(res.hazardousReason).toContain('bình gas');
  });
});
