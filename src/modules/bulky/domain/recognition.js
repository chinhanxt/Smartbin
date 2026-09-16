import { ACCEPTED_ITEM_TYPES, AI_DECISION } from './constants.js';

export function evaluateAiResult({ itemType, confidence = 0, quantity, ...input } = {}) {
  const accepted = ACCEPTED_ITEM_TYPES.includes(itemType);
  const result = {
    ...input,
    itemType: accepted ? itemType : 'OTHER',
    confidence,
    suggestedQuantity: Number.isInteger(quantity) ? quantity : undefined,
    requiresManualReview: !accepted,
    decision: !accepted
      ? AI_DECISION.MANUAL_REVIEW
      : confidence >= 0.8
        ? AI_DECISION.ACCEPTED
        : AI_DECISION.CONFIRM_REQUIRED,
  };
  return Object.fromEntries(Object.entries(result).filter(([, value]) => value !== undefined));
}
