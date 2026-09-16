import { ACCEPTED_ITEM_TYPES, AI_DECISION } from './constants.js';

export function evaluateAiResult({ itemType, confidence = 0, quantity, uncertain = false } = {}) {
  const accepted = ACCEPTED_ITEM_TYPES.includes(itemType);
  const manualReview = !accepted || uncertain;
  const result = {
    itemType: accepted ? itemType : 'OTHER',
    confidence,
    suggestedQuantity: Number.isInteger(quantity) ? quantity : undefined,
    requiresManualReview: manualReview,
    decision: manualReview
      ? AI_DECISION.MANUAL_REVIEW
      : confidence >= 0.8
        ? AI_DECISION.SUGGESTED
        : AI_DECISION.NEEDS_CONFIRMATION,
  };
  return Object.fromEntries(Object.entries(result).filter(([, value]) => value !== undefined));
}
