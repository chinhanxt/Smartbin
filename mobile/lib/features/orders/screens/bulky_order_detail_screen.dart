import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/bulky_constants.dart';
import '../../../core/domain/models/bulky_order.dart';
import '../../../core/theme/bulky_colors.dart';
import '../../quote/widgets/tolerance_guarantee_banner.dart';
import '../providers/orders_provider.dart';

/// Detailed view of a bulky waste order with a 4-step progress timeline,
/// driver info, pickup logistics, itemized breakdown, and cancellation option.
class BulkyOrderDetailScreen extends StatelessWidget {
  final String? orderId;

  const BulkyOrderDetailScreen({
    super.key,
    this.orderId,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveOrderId = orderId ??
        ModalRoute.of(context)?.settings.arguments as String?;

    if (effectiveOrderId == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chi Tiết Đơn Hàng')),
        body: const Center(child: Text('Không tìm thấy mã đơn hàng.')),
      );
    }

    final ordersProvider = context.watch<OrdersProvider>();
    final order = ordersProvider.getOrderById(effectiveOrderId);

    if (order == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chi Tiết Đơn Hàng')),
        body: const Center(child: Text('Đơn hàng không tồn tại.')),
      );
    }

    final statusColor = _getStatusColor(order.status);
    final statusBgColor = _getStatusBgColor(order.status);

    return Scaffold(
      backgroundColor: BulkyColors.background,
      appBar: AppBar(
        title: const Text(
          'Chi Tiết Đơn Hàng',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        elevation: 0,
        backgroundColor: BulkyColors.surface,
        foregroundColor: BulkyColors.textPrimary,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Order ID & Status Header Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: BulkyColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: BulkyColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        order.id,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: BulkyColors.textPrimary,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusBgColor,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                        ),
                        child: Text(
                          order.status.displayName,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: statusColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Ngày tạo: ${order.createdAt.day.toString().padLeft(2, '0')}/${order.createdAt.month.toString().padLeft(2, '0')}/${order.createdAt.year}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: BulkyColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 4-Step Timeline Card
            _buildTimelineCard(order),
            const SizedBox(height: 16),

            // Vehicle & Driver Info Card (if assigned or past confirmation)
            _buildDriverVehicleCard(order),
            const SizedBox(height: 16),

            // Logistics & Pickup Information Card
            _buildLogisticsCard(order),
            const SizedBox(height: 16),

            // Items breakdown Card
            _buildItemsCard(order),
            const SizedBox(height: 16),

            // Cost & Deposit Summary Card
            _buildCostSummaryCard(order),
            const SizedBox(height: 16),

            // Tolerance Policy Guarantee Banner
            ToleranceGuaranteeBanner(policy: order.quote.tolerancePolicy),
            const SizedBox(height: 24),

            // Order Action Buttons
            _buildActionButtons(context, ordersProvider, order),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildTimelineCard(BulkyOrder order) {
    final isStep1Active = order.status != BulkyOrderStatus.DRAFT &&
        order.status != BulkyOrderStatus.AWAITING_PAYMENT &&
        order.status != BulkyOrderStatus.CANCELLED;

    final isStep2Active = [
      BulkyOrderStatus.SCHEDULED,
      BulkyOrderStatus.ASSIGNED,
      BulkyOrderStatus.IN_PROGRESS,
      BulkyOrderStatus.COLLECTED,
      BulkyOrderStatus.COMPLETED,
    ].contains(order.status);

    final isStep3Active = [
      BulkyOrderStatus.IN_PROGRESS,
      BulkyOrderStatus.COLLECTED,
      BulkyOrderStatus.COMPLETED,
    ].contains(order.status);

    final isStep4Active = order.status == BulkyOrderStatus.COMPLETED;

    final timelineSteps = [
      {'title': 'Đã đặt cọc', 'active': isStep1Active, 'desc': 'Đã cọc giữ chỗ'},
      {'title': 'Đã xếp lịch xe & Tài xế', 'active': isStep2Active, 'desc': 'Đã điều phối xe thu gom'},
      {'title': 'Đang đến lấy rác', 'active': isStep3Active, 'desc': 'Tài xế đang di chuyển'},
      {'title': 'Hoàn tất thu gom', 'active': isStep4Active, 'desc': 'Đã hoàn tất thanh toán'},
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: BulkyColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: BulkyColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.timeline_rounded, size: 20, color: BulkyColors.primary),
              SizedBox(width: 8),
              Text(
                'Lộ trình xử lý đơn hàng',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: BulkyColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...List.generate(timelineSteps.length, (index) {
            final step = timelineSteps[index];
            final isActive = step['active'] as bool;
            final isLast = index == timelineSteps.length - 1;

            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: isActive ? BulkyColors.primary : BulkyColors.background,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isActive ? BulkyColors.primary : BulkyColors.border,
                          width: 2,
                        ),
                      ),
                      child: Center(
                        child: isActive
                            ? const Icon(Icons.check, size: 14, color: Colors.white)
                            : Text(
                                '${index + 1}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: BulkyColors.textSecondary,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                    if (!isLast)
                      Container(
                        width: 2,
                        height: 28,
                        color: isActive ? BulkyColors.primary : BulkyColors.border,
                      ),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          step['title'] as String,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                            color: isActive ? BulkyColors.textPrimary : BulkyColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          step['desc'] as String,
                          style: const TextStyle(
                            fontSize: 11,
                            color: BulkyColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            );
          }),
        ],
      ),
    );
  }

  Widget _buildDriverVehicleCard(BulkyOrder order) {
    final vehiclePlate = order.vehiclePlate ?? '51C-889.21 (Xe tải 2.5T)';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: BulkyColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: BulkyColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.local_shipping_outlined, size: 20, color: BulkyColors.primary),
              SizedBox(width: 8),
              Text(
                'Thông tin Xe & Tài xế',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: BulkyColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: BulkyColors.border),
          const SizedBox(height: 12),
          _buildInfoRow('Biển số xe:', vehiclePlate),
          const SizedBox(height: 8),
          _buildInfoRow('Tài xế:', 'Nguyễn Văn Hùng • 0909.123.456'),
          const SizedBox(height: 8),
          _buildInfoRow('Đơn vị phụ trách:', 'Đội Vệ Sinh Môi Trường Đô Thị Q.1'),
        ],
      ),
    );
  }

  Widget _buildLogisticsCard(BulkyOrder order) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: BulkyColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: BulkyColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.place_outlined, size: 20, color: BulkyColors.primary),
              SizedBox(width: 8),
              Text(
                'Thông tin Địa điểm & Hẹn giờ',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: BulkyColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: BulkyColors.border),
          const SizedBox(height: 12),
          _buildInfoRow('Địa chỉ thu gom:', order.address.isNotEmpty ? order.address : 'Chưa nhập'),
          const SizedBox(height: 8),
          _buildInfoRow('Ngày thu gom:', order.pickupDate.isNotEmpty ? order.pickupDate : 'Chưa xếp'),
          if (order.contactName != null) ...[
            const SizedBox(height: 8),
            _buildInfoRow('Người liên hệ:', '${order.contactName} - ${order.contactPhone ?? ""}'),
          ],
          const SizedBox(height: 8),
          _buildInfoRow(
            'Bốc xếp tầng lầu:',
            order.floorNumber > 0
                ? 'Tầng ${order.floorNumber} (${order.hasElevator ? "Có thang máy" : "Thang bộ"})'
                : 'Tầng trệt',
          ),
          if (order.requiresDisassembly) ...[
            const SizedBox(height: 8),
            _buildInfoRow('Yêu cầu tháo dỡ:', 'Có hỗ trợ tháo dỡ'),
          ],
          if (order.note != null && order.note!.isNotEmpty) ...[
            const SizedBox(height: 8),
            _buildInfoRow('Ghi chú:', order.note!),
          ],
        ],
      ),
    );
  }

  Widget _buildItemsCard(BulkyOrder order) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: BulkyColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: BulkyColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.inventory_2_outlined, size: 20, color: BulkyColors.primary),
              const SizedBox(width: 8),
              Text(
                'Danh mục vật dụng (${order.items.length})',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: BulkyColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: BulkyColors.border),
          const SizedBox(height: 8),
          ...order.items.map((item) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '${item.displayName} (x${item.quantity})',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: BulkyColors.textPrimary,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: BulkyColors.background,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: BulkyColors.border),
                    ),
                    child: Text(
                      '${item.material.emoji} ${item.material.shortLabel}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: BulkyColors.textSecondary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '~${(item.estimatedUnitWeightKg * item.quantity).toStringAsFixed(1)} kg',
                    style: const TextStyle(
                      fontSize: 12,
                      color: BulkyColors.textSecondary,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildCostSummaryCard(BulkyOrder order) {
    final q = order.quote;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: BulkyColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: BulkyColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.receipt_long_outlined, size: 20, color: BulkyColors.primary),
              SizedBox(width: 8),
              Text(
                'Chi phí & Tiền cọc',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: BulkyColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: BulkyColors.border),
          const SizedBox(height: 12),
          _buildInfoRow(
            'Ước tính cước:',
            '${BulkyColors.formatCurrency(q.minVnd)} - ${BulkyColors.formatCurrency(q.maxVnd)}',
          ),
          const SizedBox(height: 8),
          _buildInfoRow(
            'Tiền cọc giữ chỗ:',
            BulkyColors.formatCurrency(q.depositHoldVnd),
          ),
          const SizedBox(height: 8),
          _buildInfoRow(
            'Trạng thái tiền cọc:',
            order.paymentStatus.label,
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(
    BuildContext context,
    OrdersProvider ordersProvider,
    BulkyOrder order,
  ) {
    final canPay = order.status == BulkyOrderStatus.AWAITING_PAYMENT;
    final canCancel = order.status == BulkyOrderStatus.AWAITING_PAYMENT ||
        order.status == BulkyOrderStatus.CONFIRMED;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (canPay) ...[
          ElevatedButton(
            key: const Key('pay_deposit_now_button'),
            onPressed: () {
              Navigator.pushNamed(context, '/payment', arguments: order.id);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: BulkyColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text(
              'Thanh toán cọc ngay',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 12),
        ],
        if (canCancel) ...[
          OutlinedButton(
            onPressed: () {
              _showCancelDialog(context, ordersProvider, order.id);
            },
            style: OutlinedButton.styleFrom(
              foregroundColor: BulkyColors.error,
              side: const BorderSide(color: BulkyColors.error),
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text(
              'Hủy đơn hàng',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ],
    );
  }

  void _showCancelDialog(
    BuildContext context,
    OrdersProvider ordersProvider,
    String orderId,
  ) {
    showDialog(
      context: context,
      builder: (dialogCtx) {
        return AlertDialog(
          title: const Text('Xác nhận hủy đơn'),
          content: const Text('Bạn có chắc chắn muốn hủy đơn thu gom này?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogCtx),
              child: const Text('Đóng'),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(dialogCtx);
                await ordersProvider.cancelOrder(orderId);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Đã hủy đơn hàng thành công.'),
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: BulkyColors.error,
                foregroundColor: Colors.white,
              ),
              child: const Text('Xác nhận'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 140,
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              color: BulkyColors.textSecondary,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: BulkyColors.textPrimary,
            ),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(BulkyOrderStatus status) {
    switch (status) {
      case BulkyOrderStatus.DRAFT:
      case BulkyOrderStatus.AWAITING_PAYMENT:
        return BulkyColors.warning;
      case BulkyOrderStatus.CONFIRMED:
      case BulkyOrderStatus.SCHEDULED:
      case BulkyOrderStatus.ASSIGNED:
        return BulkyColors.primary;
      case BulkyOrderStatus.IN_PROGRESS:
      case BulkyOrderStatus.COLLECTED:
        return const Color(0xFF6366F1);
      case BulkyOrderStatus.COMPLETED:
        return BulkyColors.success;
      case BulkyOrderStatus.CANCELLED:
        return BulkyColors.error;
    }
  }

  Color _getStatusBgColor(BulkyOrderStatus status) {
    switch (status) {
      case BulkyOrderStatus.DRAFT:
      case BulkyOrderStatus.AWAITING_PAYMENT:
        return BulkyColors.warningBg;
      case BulkyOrderStatus.CONFIRMED:
      case BulkyOrderStatus.SCHEDULED:
      case BulkyOrderStatus.ASSIGNED:
        return BulkyColors.primaryLight.withValues(alpha: 0.12);
      case BulkyOrderStatus.IN_PROGRESS:
      case BulkyOrderStatus.COLLECTED:
        return const Color(0xFFEEF2FF);
      case BulkyOrderStatus.COMPLETED:
        return BulkyColors.successBg;
      case BulkyOrderStatus.CANCELLED:
        return BulkyColors.errorBg;
    }
  }
}
