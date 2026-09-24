import 'package:flutter/material.dart' hide MaterialType;
import '../../../../core/constants/bulky_constants.dart';
import '../../../../core/theme/bulky_colors.dart';

/// 1-Click interactive material survey chip group.
/// Allows rapid user selection between LIGHT (-20%), STANDARD (Gốc), and HEAVY (+30%).
class MaterialSurveyChips extends StatelessWidget {
  final MaterialType selectedMaterial;
  final ValueChanged<MaterialType> onMaterialChanged;

  const MaterialSurveyChips({
    super.key,
    required this.selectedMaterial,
    required this.onMaterialChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            Expanded(
              child: _buildChip(
                context,
                type: MaterialType.LIGHT,
                emoji: '🪶',
                label: 'Nhựa / Mút xốp',
                deltaText: '-20%',
                selectedColor: BulkyColors.success,
                selectedBg: BulkyColors.successBg,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildChip(
                context,
                type: MaterialType.STANDARD,
                emoji: '🪵',
                label: 'Gỗ ép / Tiêu chuẩn',
                deltaText: 'Gốc',
                selectedColor: BulkyColors.primary,
                selectedBg: BulkyColors.primaryLight.withValues(alpha: 0.12),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildChip(
                context,
                type: MaterialType.HEAVY,
                emoji: '🪨',
                label: 'Gỗ đặc / Đá / Rất nặng',
                deltaText: '+30%',
                selectedColor: BulkyColors.warning,
                selectedBg: BulkyColors.warningBg,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildChip(
    BuildContext context, {
    required MaterialType type,
    required String emoji,
    required String label,
    required String deltaText,
    required Color selectedColor,
    required Color selectedBg,
  }) {
    final isSelected = selectedMaterial == type;

    return Semantics(
      button: true,
      selected: isSelected,
      label: '$label, chênh lệch giá $deltaText',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => onMaterialChanged(type),
          borderRadius: BorderRadius.circular(12),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected ? selectedBg : BulkyColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? selectedColor : BulkyColors.border,
                width: isSelected ? 2 : 1,
              ),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: selectedColor.withValues(alpha: 0.15),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : null,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Emoji and Delta badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      emoji,
                      style: const TextStyle(fontSize: 16),
                    ),
                    const SizedBox(width: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 5,
                        vertical: 1.5,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? selectedColor.withValues(alpha: 0.2)
                            : Colors.grey.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        deltaText,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? selectedColor : BulkyColors.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                // Text label
                Text(
                  label,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    height: 1.2,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected ? selectedColor : BulkyColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
