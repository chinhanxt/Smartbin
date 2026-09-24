import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/bulky_constants.dart';
import '../../../core/domain/models/bulky_order.dart';
import '../../../core/theme/bulky_colors.dart';
import '../providers/orders_provider.dart';

/// Screen listing customer bulky waste collection orders with status filtering.
class BulkyOrdersListScreen extends StatefulWidget {
  const BulkyOrdersListScreen({super.key});

  @override
  State<BulkyOrdersListScreen> createState() => _BulkyOrdersListScreenState();
}

class _BulkyOrdersListScreenState extends State<BulkyOrdersListScreen> {
  int _selectedFilter = 0; // 0: Tất cả, 1: Đang xử lý, 2: Đã hoàn tất

  @override
  Widget build(BuildContext context) {
    final ordersProvider = context.watch<OrdersProvider>();
    final allOrders = ordersProvider.orders;

    List<BulkyOrder> displayedOrders;
    switch (_selectedFilter) {
      case 1:
        displayedOrders = ordersProvider.activeOrders;
        break;
      case 2:
        displayedOrders = ordersProvider.completedOrders;
        break;
      case 0:
      default:
        displayedOrders = allOrders;
        break;
    }

    return Scaffold(
      backgroundColor: BulkyColors.background,
      appBar: AppBar(
        title: const Text(
          'Đơn Của Tôi',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        elevation: 0,
        backgroundColor: BulkyColors.surface,
        foregroundColor: BulkyColors.textPrimary,
      ),
      body: Column(
        children: [
          // Filter Tabs
          _buildFilterTabs(),

          // Orders List with Pull-to-refresh
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => ordersProvider.loadOrders(),
              child: ordersProvider.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : displayedOrders.isEmpty
                      ? _buildEmptyState()
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: displayedOrders.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final order = displayedOrders[index];
                            return _buildOrderCard(context, order);
                          },
                        ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTabs() {
    final filters = ['Tất cả', 'Đang xử lý', 'Đã hoàn tất'];

    return Container(
      color: BulkyColors.surface,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: List.generate(filters.length, (index) {
          final isSelected = _selectedFilter == index;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(filters[index]),
              selected: isSelected,
              onSelected: (selected) {
                if (selected) {
                  setState(() {
                    _selectedFilter = index;
                  });
                }
              },
              selectedColor: BulkyColors.primaryLight.withValues(alpha: 0.15),
              backgroundColor: BulkyColors.background,
              side: BorderSide(
                color: isSelected ? BulkyColors.primary : BulkyColors.border,
              ),
              labelStyle: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? BulkyColors.primary : BulkyColors.textSecondary,
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildEmptyState() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.15),
        Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: BulkyColors.primaryLight.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.receipt_long_outlined,
                  size: 38,
                  color: BulkyColors.primary,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Chưa có đơn hàng nào',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: BulkyColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Các yêu cầu thu gom đã đặt sẽ xuất hiện tại đây.',
                style: TextStyle(
                  fontSize: 13,
                  color: BulkyColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildOrderCard(BuildContext context, BulkyOrder order) {
    final statusColor = _getStatusColor(order.status);
    final statusBgColor = _getStatusBgColor(order.status);
    final itemsSummary = order.items.isEmpty
        ? 'Chưa có thông tin đồ'
        : '${order.totalItemsCount} món: ${order.items.map((i) => i.displayName).join(', ')}';

    return InkWell(
      key: Key('order_card_${order.id}'),
      onTap: () {
        Navigator.pushNamed(
          context,
          '/order-detail',
          arguments: order.id,
        );
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: BulkyColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: BulkyColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: ID + Status Badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  order.id,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: BulkyColors.textPrimary,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusBgColor,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                  ),
                  child: Text(
                    order.status.displayName,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Divider(height: 1, color: BulkyColors.border),
            const SizedBox(height: 10),

            // Items summary
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.inventory_2_outlined, size: 16, color: BulkyColors.textSecondary),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    itemsSummary,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: BulkyColors.textPrimary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),

            // Pickup Date & Address
            Row(
              children: [
                const Icon(Icons.calendar_today_outlined, size: 15, color: BulkyColors.textSecondary),
                const SizedBox(width: 6),
                Text(
                  'Lịch hẹn: ${order.pickupDate.isNotEmpty ? order.pickupDate : "Chưa xác định"}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: BulkyColors.textSecondary,
                  ),
                ),
              ],
            ),
            if (order.address.isNotEmpty) ...[
              const SizedBox(height: 4),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.location_on_outlined, size: 15, color: BulkyColors.textSecondary),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      order.address,
                      style: const TextStyle(
                        fontSize: 12,
                        color: BulkyColors.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 10),
            const Divider(height: 1, color: BulkyColors.border),
            const SizedBox(height: 10),

            // Pricing & Deposit Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Ước tính:',
                      style: TextStyle(fontSize: 11, color: BulkyColors.textSecondary),
                    ),
                    Text(
                      '${BulkyColors.formatCurrency(order.quote.minVnd)} - ${BulkyColors.formatCurrency(order.quote.maxVnd)}',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: BulkyColors.primary,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text(
                      'Cọc giữ chỗ:',
                      style: TextStyle(fontSize: 11, color: BulkyColors.textSecondary),
                    ),
                    Text(
                      BulkyColors.formatCurrency(order.quote.depositHoldVnd),
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: BulkyColors.warning,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
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
