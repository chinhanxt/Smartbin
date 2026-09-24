import 'package:flutter/material.dart' hide MaterialType;
import 'package:provider/provider.dart';
import '../../../../core/constants/bulky_constants.dart';
import '../../../../core/domain/models/bulky_item.dart';
import '../../../../core/theme/bulky_colors.dart';
import '../../scan/providers/scan_provider.dart';
import '../../scan/widgets/bulky_camera_preview.dart';
import '../providers/booking_wizard_provider.dart';
import 'material_survey_chips.dart';

/// Step 1 of Booking Wizard: Camera/Photo scanning, AI recognition trigger,
/// and interactive bulky item list editor with 1-click material survey.
class StepItemsEditor extends StatelessWidget {
  const StepItemsEditor({super.key});

  Future<void> _syncFromScan(
    BuildContext context,
    ScanProvider scanProvider,
    BookingWizardProvider wizardProvider,
  ) async {
    if (scanProvider.imageBytes == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Vui lòng chọn ảnh mẫu hoặc chụp/tải ảnh đồ vật để AI nhận diện.',
          ),
          backgroundColor: BulkyColors.warning,
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    if (scanProvider.result == null || scanProvider.result!.items.isEmpty) {
      await scanProvider.scanImage(scanProvider.imageBytes!);
    }

    if (!context.mounted) return;

    if (scanProvider.result != null && scanProvider.result!.items.isNotEmpty) {
      wizardProvider.initFromScan(
        scanProvider.result!,
        scanProvider.imageBytes,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '✓ Đã nhận diện ${scanProvider.result!.items.length} món đồ và cập nhật thông tin!',
          ),
          backgroundColor: BulkyColors.success,
          duration: const Duration(seconds: 2),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            scanProvider.errorMessage ??
                'Không phát hiện thấy vật dụng cồng kềnh trong ảnh. Bạn có thể thêm thủ công bên dưới.',
          ),
          backgroundColor: BulkyColors.warning,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final scanProvider = context.watch<ScanProvider>();
    final wizard = context.watch<BookingWizardProvider>();
    final selectedBoxIndex = scanProvider.selectedBoxIndex;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. Camera / Photo Preview
          BulkyCameraPreview(
            previewHeight: 220,
            onBoxSelected: (index) {
              scanProvider.selectBox(index);
            },
          ),
          const SizedBox(height: 12),

          // 2. AI Scan Trigger & Banner
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: scanProvider.hasResult
                  ? BulkyColors.successBg
                  : BulkyColors.primaryLight.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: scanProvider.hasResult
                    ? BulkyColors.success.withValues(alpha: 0.4)
                    : BulkyColors.primaryLight.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  scanProvider.hasResult
                      ? Icons.check_circle_rounded
                      : Icons.auto_awesome_rounded,
                  color: scanProvider.hasResult
                      ? BulkyColors.success
                      : BulkyColors.primary,
                  size: 24,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        scanProvider.hasResult
                            ? 'AI đã nhận diện ${scanProvider.result!.items.length} món đồ'
                            : 'Trợ lý AI Gemini Vision',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: scanProvider.hasResult
                              ? BulkyColors.success
                              : BulkyColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        scanProvider.hasResult
                            ? 'Bấm nút bên để đồng bộ vào danh sách'
                            : 'Chụp hoặc tải ảnh để tự động phát hiện phế thải',
                        style: const TextStyle(
                          fontSize: 11,
                          color: BulkyColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  key: const Key('ai_scan_trigger_button'),
                  onPressed: scanProvider.isScanning
                      ? null
                      : () => _syncFromScan(context, scanProvider, wizard),
                  icon: scanProvider.isScanning
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.auto_awesome, size: 16),
                  label: const Text(
                    'Quét với AI',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: BulkyColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 3. Section Header & Add Item Button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Danh sách đồ vật (${wizard.items.length})',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: BulkyColors.textPrimary,
                ),
              ),
              TextButton.icon(
                onPressed: () {
                  final newIndex = wizard.items.length + 1;
                  wizard.addItem(
                    BulkyItem(
                      id: 'item-${DateTime.now().millisecondsSinceEpoch}',
                      category: BulkyCategory.OTHER,
                      displayName: 'Món đồ $newIndex',
                      quantity: 1,
                      material: MaterialType.STANDARD,
                    ),
                  );
                },
                icon: const Icon(Icons.add_circle_outline, size: 18),
                label: const Text('Thêm món đồ'),
                style: TextButton.styleFrom(
                  foregroundColor: BulkyColors.primary,
                  textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // 4. Empty state or Items list
          if (wizard.items.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
              decoration: BoxDecoration(
                color: BulkyColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: BulkyColors.border),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.inventory_2_outlined,
                    size: 40,
                    color: BulkyColors.textSecondary.withValues(alpha: 0.6),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Chưa có đồ vật nào',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: BulkyColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Chụp ảnh hoặc nhấn "+ Thêm món đồ" để bắt đầu',
                    style: TextStyle(
                      fontSize: 12,
                      color: BulkyColors.textSecondary,
                    ),
                  ),
                ],
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: wizard.items.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = wizard.items[index];
                final isHighlighted = selectedBoxIndex == index;

                return _ItemCard(
                  key: ValueKey(item.id),
                  item: item,
                  index: index,
                  isHighlighted: isHighlighted,
                  onSelect: () {
                    scanProvider.selectBox(index);
                  },
                  onDisplayNameChanged: (newName) {
                    wizard.updateItem(index, item.copyWith(displayName: newName));
                  },
                  onCategoryChanged: (newCat) {
                    if (newCat != null) {
                      wizard.updateItem(index, item.copyWith(category: newCat));
                    }
                  },
                  onMaterialChanged: (newMat) {
                    wizard.updateItemMaterial(index, newMat);
                  },
                  onQuantityChanged: (qty) {
                    wizard.updateItemQuantity(index, qty);
                  },
                  onRemove: () {
                    wizard.removeItem(index);
                  },
                );
              },
            ),
        ],
      ),
    );
  }
}

class _ItemCard extends StatefulWidget {
  final BulkyItem item;
  final int index;
  final bool isHighlighted;
  final VoidCallback onSelect;
  final ValueChanged<String> onDisplayNameChanged;
  final ValueChanged<BulkyCategory?> onCategoryChanged;
  final ValueChanged<MaterialType> onMaterialChanged;
  final ValueChanged<int> onQuantityChanged;
  final VoidCallback onRemove;

  const _ItemCard({
    super.key,
    required this.item,
    required this.index,
    required this.isHighlighted,
    required this.onSelect,
    required this.onDisplayNameChanged,
    required this.onCategoryChanged,
    required this.onMaterialChanged,
    required this.onQuantityChanged,
    required this.onRemove,
  });

  @override
  State<_ItemCard> createState() => _ItemCardState();
}

class _ItemCardState extends State<_ItemCard> {
  late TextEditingController _nameController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.item.displayName);
  }

  @override
  void didUpdateWidget(covariant _ItemCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.item.displayName != widget.item.displayName &&
        _nameController.text != widget.item.displayName) {
      _nameController.text = widget.item.displayName;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;

    return GestureDetector(
      onTap: widget.onSelect,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: widget.isHighlighted
              ? BulkyColors.primaryLight.withValues(alpha: 0.05)
              : BulkyColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: widget.isHighlighted ? BulkyColors.primary : BulkyColors.border,
            width: widget.isHighlighted ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: widget.isHighlighted
                  ? BulkyColors.primary.withValues(alpha: 0.1)
                  : Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Category dropdown & Delete button
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: BulkyColors.background,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: BulkyColors.border),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<BulkyCategory>(
                      value: item.category,
                      isDense: true,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: BulkyColors.textPrimary,
                      ),
                      items: BulkyCategory.values.map((cat) {
                        return DropdownMenuItem<BulkyCategory>(
                          value: cat,
                          child: Text(cat.displayName),
                        );
                      }).toList(),
                      onChanged: widget.onCategoryChanged,
                    ),
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.delete_outline, size: 20),
                  color: BulkyColors.error,
                  tooltip: 'Xóa món đồ',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  onPressed: widget.onRemove,
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Item Name & Quantity Stepper
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(8)),
                      ),
                      labelText: 'Tên món đồ',
                    ),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                    onChanged: widget.onDisplayNameChanged,
                  ),
                ),
                const SizedBox(width: 12),
                // Stepper: [-] qty [+]
                Container(
                  decoration: BoxDecoration(
                    color: BulkyColors.background,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: BulkyColors.border),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      InkWell(
                        onTap: () => widget.onQuantityChanged(item.quantity - 1),
                        borderRadius: const BorderRadius.horizontal(left: Radius.circular(8)),
                        child: const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          child: Icon(Icons.remove, size: 16, color: BulkyColors.textPrimary),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        child: Text(
                          '${item.quantity}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: BulkyColors.textPrimary,
                          ),
                        ),
                      ),
                      InkWell(
                        onTap: () => widget.onQuantityChanged(item.quantity + 1),
                        borderRadius: const BorderRadius.horizontal(right: Radius.circular(8)),
                        child: const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          child: Icon(Icons.add, size: 16, color: BulkyColors.textPrimary),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // 1-Click Material Survey Chips
            const Text(
              'Chất liệu cấu thành:',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: BulkyColors.textSecondary,
              ),
            ),
            const SizedBox(height: 6),
            MaterialSurveyChips(
              selectedMaterial: item.material,
              onMaterialChanged: widget.onMaterialChanged,
            ),
            const SizedBox(height: 10),

            // Estimated Weight & Line Subtotal
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: BulkyColors.background,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.scale_outlined, size: 15, color: BulkyColors.textSecondary),
                      const SizedBox(width: 4),
                      Text(
                        '~${item.totalEstimatedWeightKg.toStringAsFixed(1)} kg',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: BulkyColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    BulkyColors.formatCurrency(item.totalPriceVnd),
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: BulkyColors.primary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
