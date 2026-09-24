import 'package:flutter/material.dart' hide MaterialType;
import 'package:provider/provider.dart';
import '../../../../core/theme/bulky_colors.dart';
import '../providers/booking_wizard_provider.dart';
import '../widgets/live_pricing_bottom_bar.dart';
import '../widgets/step_items_editor.dart';
import '../widgets/step_logistics_editor.dart';
import '../widgets/step_review_summary.dart';

/// 3-Step Wizard Screen for Bulky Waste collection booking.
/// Step 0: Đồ vật & Ảnh (Items, Camera, AI recognition, Material survey)
/// Step 1: Địa điểm & Bốc xếp (Address, Date/Time slot, Logistics handling)
/// Step 2: Xác nhận & Báo giá (Review order summary, 2-tiered quote, tolerance guarantee)
class BulkyBookingWizardScreen extends StatelessWidget {
  const BulkyBookingWizardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final wizard = context.watch<BookingWizardProvider>();
    final currentStep = wizard.currentStep;

    return Scaffold(
      backgroundColor: BulkyColors.background,
      appBar: AppBar(
        title: const Text(
          'Đặt Thu Gom Rác Cồng Kềnh',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        centerTitle: false,
        elevation: 0,
        backgroundColor: BulkyColors.surface,
        foregroundColor: BulkyColors.textPrimary,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () {
            if (currentStep > 0) {
              wizard.prevStep();
            } else if (Navigator.canPop(context)) {
              Navigator.pop(context);
            }
          },
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 22),
            tooltip: 'Làm mới / Đặt lại',
            onPressed: () {
              wizard.reset();
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Top Segmented Stepper Header
            _buildStepperHeader(context, currentStep),

            // Active Step Content
            Expanded(
              child: _buildStepBody(currentStep),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const LivePricingBottomBar(),
    );
  }

  Widget _buildStepBody(int step) {
    switch (step) {
      case 0:
        return const StepItemsEditor();
      case 1:
        return const StepLogisticsEditor();
      case 2:
        return const StepReviewSummary();
      default:
        return const StepItemsEditor();
    }
  }

  Widget _buildStepperHeader(BuildContext context, int currentStep) {
    final steps = [
      '1: Đồ vật & Ảnh',
      '2: Địa điểm',
      '3: Xác nhận',
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: BulkyColors.surface,
        border: Border(
          bottom: BorderSide(color: BulkyColors.border, width: 1),
        ),
      ),
      child: Row(
        children: List.generate(steps.length * 2 - 1, (index) {
          if (index.isOdd) {
            // Divider line between steps
            final prevStepIndex = index ~/ 2;
            final isCompleted = currentStep > prevStepIndex;
            return Expanded(
              child: Container(
                height: 2,
                color: isCompleted ? BulkyColors.primary : BulkyColors.border,
                margin: const EdgeInsets.symmetric(horizontal: 4),
              ),
            );
          }

          final stepIndex = index ~/ 2;
          final isActive = currentStep == stepIndex;
          final isCompleted = currentStep > stepIndex;

          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isActive
                  ? BulkyColors.primaryLight.withValues(alpha: 0.15)
                  : (isCompleted ? BulkyColors.successBg : Colors.transparent),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isActive
                    ? BulkyColors.primary
                    : (isCompleted ? BulkyColors.success : BulkyColors.border),
                width: isActive ? 1.5 : 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (isCompleted)
                  const Icon(Icons.check, size: 14, color: BulkyColors.success)
                else
                  Text(
                    '${stepIndex + 1}',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isActive ? BulkyColors.primary : BulkyColors.textSecondary,
                    ),
                  ),
                const SizedBox(width: 4),
                Text(
                  steps[stepIndex],
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: isActive || isCompleted ? FontWeight.bold : FontWeight.w500,
                    color: isActive
                        ? BulkyColors.primary
                        : (isCompleted ? BulkyColors.success : BulkyColors.textSecondary),
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }
}
