import 'package:flutter/material.dart' hide MaterialType;
import 'package:provider/provider.dart';
import '../../../../core/theme/bulky_colors.dart';
import '../providers/booking_wizard_provider.dart';

/// Persistent bottom action bar displaying real-time price estimation,
/// deposit hold requirement, and step navigation buttons.
class LivePricingBottomBar extends StatelessWidget {
  final VoidCallback? onNext;
  final VoidCallback? onBack;

  const LivePricingBottomBar({
    super.key,
    this.onNext,
    this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<BookingWizardProvider>(
      builder: (context, wizard, child) {
        final quote = wizard.currentQuote;
        final hasQuote = quote != null;
        final canGoNext = wizard.canGoNext();
        final currentStep = wizard.currentStep;

        final minVnd = hasQuote ? quote.minVnd : 0;
        final maxVnd = hasQuote ? quote.maxVnd : 0;
        final depositHoldVnd = hasQuote ? quote.depositHoldVnd : 0;

        return Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          decoration: BoxDecoration(
            color: BulkyColors.surface,
            border: const Border(
              top: BorderSide(color: BulkyColors.border, width: 1),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 10,
                offset: const Offset(0, -3),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Price Estimation & Deposit Info
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Row(
                            children: [
                              const Text(
                                'Ước tính: ',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: BulkyColors.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              if (hasQuote)
                                Flexible(
                                  child: Text(
                                    '${BulkyColors.formatCurrency(minVnd)} - ${BulkyColors.formatCurrency(maxVnd)}',
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                      color: BulkyColors.primary,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                )
                              else
                                const Text(
                                  '0 đ',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: BulkyColors.textSecondary,
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              Text(
                                'Cọc giữ chỗ: ${BulkyColors.formatCurrency(depositHoldVnd)}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: BulkyColors.warning,
                                ),
                              ),
                              if (wizard.items.isNotEmpty) ...[
                                const Text(
                                  ' • ',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: BulkyColors.textSecondary,
                                  ),
                                ),
                                Text(
                                  '~${wizard.totalEstimatedWeightKg.toStringAsFixed(1)} kg',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: BulkyColors.textSecondary,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Navigation Buttons
                Row(
                  children: [
                    if (currentStep > 0) ...[
                      OutlinedButton.icon(
                        key: const Key('wizard_back_button'),
                        onPressed: onBack ?? () => wizard.prevStep(),
                        icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 16),
                        label: const Text('Quay lại'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: BulkyColors.textPrimary,
                          side: const BorderSide(color: BulkyColors.border),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                    Expanded(
                      child: ElevatedButton(
                        key: const Key('wizard_next_button'),
                        onPressed: canGoNext
                            ? (onNext ?? () => wizard.nextStep())
                            : null,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          backgroundColor: BulkyColors.primary,
                          foregroundColor: Colors.white,
                          disabledBackgroundColor: BulkyColors.border,
                          disabledForegroundColor: BulkyColors.textSecondary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          elevation: canGoNext ? 2 : 0,
                        ),
                        child: Text(
                          currentStep == 2 ? 'Xác nhận & Báo giá' : 'Tiếp tục',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
