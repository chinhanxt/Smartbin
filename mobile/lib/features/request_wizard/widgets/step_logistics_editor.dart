import 'package:flutter/material.dart' hide MaterialType;
import 'package:provider/provider.dart';
import '../../../../core/theme/bulky_colors.dart';
import '../providers/booking_wizard_provider.dart';

/// Step 2 of Booking Wizard: Logistics, Pickup Address, Time Slot, and Handling Options.
class StepLogisticsEditor extends StatefulWidget {
  const StepLogisticsEditor({super.key});

  @override
  State<StepLogisticsEditor> createState() => _StepLogisticsEditorState();
}

class _StepLogisticsEditorState extends State<StepLogisticsEditor> {
  late TextEditingController _addressController;
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _dateController;
  late TextEditingController _notesController;

  static const List<String> kTimeSlots = [
    '08:00 - 10:00',
    '10:00 - 12:00',
    '14:00 - 16:00',
    '16:00 - 18:00',
  ];

  static const String kSampleAddress = '123 Nguyễn Thị Minh Khai, P. Bến Nghé, Q.1';

  @override
  void initState() {
    super.initState();
    final wizard = Provider.of<BookingWizardProvider>(context, listen: false);
    _addressController = TextEditingController(text: wizard.address);
    _nameController = TextEditingController(text: wizard.contactName);
    _phoneController = TextEditingController(text: wizard.contactPhone);
    _dateController = TextEditingController(text: wizard.scheduledDate);
    _notesController = TextEditingController(text: wizard.notes);
  }

  @override
  void dispose() {
    _addressController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _dateController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  String _formatDate(DateTime dt) {
    return '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
  }

  Future<void> _selectDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 30)),
    );
    if (!mounted) return;
    if (picked != null) {
      final dateStr = _formatDate(picked);
      _dateController.text = dateStr;
      context.read<BookingWizardProvider>().setCustomerInfo(date: dateStr);
    }
  }

  @override
  Widget build(BuildContext context) {
    final wizard = context.watch<BookingWizardProvider>();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. Pickup Address Section
          _buildCard(
            title: 'Địa điểm thu gom',
            icon: Icons.location_on_outlined,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextFormField(
                  controller: _addressController,
                  decoration: const InputDecoration(
                    labelText: 'Địa chỉ cụ thể (Số nhà, tên đường, phường, quận)',
                    prefixIcon: Icon(Icons.home_outlined),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.all(Radius.circular(10)),
                    ),
                  ),
                  onChanged: (val) => wizard.setCustomerInfo(address: val),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    ActionChip(
                      avatar: const Icon(Icons.flash_on, size: 14, color: BulkyColors.primary),
                      label: const Text(kSampleAddress),
                      labelStyle: const TextStyle(fontSize: 12, color: BulkyColors.textPrimary),
                      backgroundColor: BulkyColors.background,
                      side: const BorderSide(color: BulkyColors.border),
                      onPressed: () {
                        _addressController.text = kSampleAddress;
                        wizard.setCustomerInfo(address: kSampleAddress);
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 2. Contact Information
          _buildCard(
            title: 'Thông tin người liên hệ',
            icon: Icons.person_outline,
            child: Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Họ và tên',
                      prefixIcon: Icon(Icons.badge_outlined),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(10)),
                      ),
                    ),
                    onChanged: (val) => wizard.setCustomerInfo(name: val),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Số điện thoại',
                      prefixIcon: Icon(Icons.phone_outlined),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(10)),
                      ),
                    ),
                    onChanged: (val) => wizard.setCustomerInfo(phone: val),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 3. Schedule Date & Time Slot
          _buildCard(
            title: 'Thời gian thu gom dự kiến',
            icon: Icons.calendar_today_outlined,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _dateController,
                        readOnly: true,
                        decoration: InputDecoration(
                          labelText: 'Ngày thu gom',
                          prefixIcon: const Icon(Icons.event_outlined),
                          suffixIcon: IconButton(
                            icon: const Icon(Icons.edit_calendar_outlined),
                            onPressed: _selectDate,
                          ),
                          border: const OutlineInputBorder(
                            borderRadius: BorderRadius.all(Radius.circular(10)),
                          ),
                        ),
                        onTap: _selectDate,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    ActionChip(
                      label: const Text('Ngày mai'),
                      labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      backgroundColor: BulkyColors.background,
                      side: const BorderSide(color: BulkyColors.border),
                      onPressed: () {
                        final tomorrow = DateTime.now().add(const Duration(days: 1));
                        final dStr = _formatDate(tomorrow);
                        _dateController.text = dStr;
                        wizard.setCustomerInfo(date: dStr);
                      },
                    ),
                    ActionChip(
                      label: const Text('Ngày kia'),
                      labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      backgroundColor: BulkyColors.background,
                      side: const BorderSide(color: BulkyColors.border),
                      onPressed: () {
                        final afterTomorrow = DateTime.now().add(const Duration(days: 2));
                        final dStr = _formatDate(afterTomorrow);
                        _dateController.text = dStr;
                        wizard.setCustomerInfo(date: dStr);
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                const Text(
                  'Khung giờ thu gom:',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: BulkyColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: kTimeSlots.map((slot) {
                    final isSelected = wizard.scheduledTimeSlot == slot;
                    return ChoiceChip(
                      label: Text(slot),
                      selected: isSelected,
                      selectedColor: BulkyColors.primaryLight.withValues(alpha: 0.15),
                      labelStyle: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? BulkyColors.primary : BulkyColors.textPrimary,
                      ),
                      side: BorderSide(
                        color: isSelected ? BulkyColors.primary : BulkyColors.border,
                      ),
                      onSelected: (selected) {
                        if (selected) {
                          wizard.setCustomerInfo(timeSlot: slot);
                        }
                      },
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 4. Logistics & Handling Conditions
          _buildCard(
            title: 'Điều kiện bốc dỡ & Bê vác',
            icon: Icons.front_loader,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Vị trí tập kết đồ đạc:',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: BulkyColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: _buildLocationChoiceCard(
                        key: const Key('curbside_pickup_choice'),
                        title: 'Mặt đất / Vỉa hè',
                        desc: 'Xe cẩu bốc trực tiếp (Miễn phí tầng)',
                        emoji: '🚚',
                        isSelected: wizard.floorNumber == 0,
                        onTap: () {
                          wizard.setLogistics(floorNumber: 0, hasElevator: false);
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildLocationChoiceCard(
                        key: const Key('inside_pickup_choice'),
                        title: 'Trong nhà / Lầu cao',
                        desc: 'Bốc vác từ căn hộ / lầu cao',
                        emoji: '🏢',
                        isSelected: wizard.floorNumber > 0 || wizard.hasElevator,
                        onTap: () {
                          if (wizard.floorNumber == 0 && !wizard.hasElevator) {
                            wizard.setLogistics(floorNumber: 1);
                          }
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(),
                SwitchListTile.adaptive(
                  contentPadding: EdgeInsets.zero,
                  title: const Text(
                    'Tháo dỡ đồ (+30.000 đ)',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                  subtitle: const Text(
                    'Cần thợ tháo rời đinh ốc, bản lề giường, tủ lớn trước khi khiêng',
                    style: TextStyle(fontSize: 12, color: BulkyColors.textSecondary),
                  ),
                  value: wizard.requiresDisassembly,
                  activeThumbColor: BulkyColors.primary,
                  onChanged: (val) {
                    wizard.setLogistics(requiresDisassembly: val);
                  },
                ),
                const Divider(),
                SwitchListTile.adaptive(
                  contentPadding: EdgeInsets.zero,
                  title: const Text(
                    'Có thang máy vận chuyển (Miễn phí tầng)',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                  subtitle: const Text(
                    'Đồ đạc vừa kích thước thang máy tòa nhà chung cư / văn phòng',
                    style: TextStyle(fontSize: 12, color: BulkyColors.textSecondary),
                  ),
                  value: wizard.hasElevator,
                  activeThumbColor: BulkyColors.primary,
                  onChanged: (val) {
                    wizard.setLogistics(hasElevator: val);
                  },
                ),
                if (!wizard.hasElevator) ...[
                  const Divider(),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Số tầng lầu thang bộ (+20.000 đ/tầng)',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                            ),
                            Text(
                              'Nhân viên hỗ trợ bê vác theo cầu thang bộ',
                              style: TextStyle(fontSize: 12, color: BulkyColors.textSecondary),
                            ),
                          ],
                        ),
                        Container(
                          decoration: BoxDecoration(
                            color: BulkyColors.background,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: BulkyColors.border),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.remove, size: 16),
                                onPressed: wizard.floorNumber > 0
                                    ? () => wizard.setLogistics(
                                          floorNumber: wizard.floorNumber - 1,
                                        )
                                    : null,
                                padding: const EdgeInsets.all(4),
                                constraints: const BoxConstraints(),
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 10),
                                child: Text(
                                  'Tầng ${wizard.floorNumber}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.add, size: 16),
                                onPressed: () => wizard.setLogistics(
                                  floorNumber: wizard.floorNumber + 1,
                                ),
                                padding: const EdgeInsets.all(4),
                                constraints: const BoxConstraints(),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 5. Additional Notes
          _buildCard(
            title: 'Ghi chú thêm (Tuỳ chọn)',
            icon: Icons.note_alt_outlined,
            child: TextFormField(
              controller: _notesController,
              maxLines: 2,
              decoration: const InputDecoration(
                hintText: 'Ví dụ: Hẻm xe tải 1.5 tấn vào được, gọi trước 15 phút...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(10)),
                ),
              ),
              onChanged: (val) => wizard.setCustomerInfo(notes: val),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCard({
    required String title,
    required IconData icon,
    required Widget child,
  }) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: BulkyColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: BulkyColors.surface,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, size: 18, color: BulkyColors.primary),
                  const SizedBox(width: 8),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: BulkyColors.textPrimary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              child,
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLocationChoiceCard({
    required Key key,
    required String title,
    required String desc,
    required String emoji,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      key: key,
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isSelected
              ? BulkyColors.primaryLight.withValues(alpha: 0.1)
              : BulkyColors.background,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? BulkyColors.primary : BulkyColors.border,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(emoji, style: const TextStyle(fontSize: 18)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? BulkyColors.primary : BulkyColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              desc,
              style: const TextStyle(
                fontSize: 10,
                color: BulkyColors.textSecondary,
                height: 1.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
