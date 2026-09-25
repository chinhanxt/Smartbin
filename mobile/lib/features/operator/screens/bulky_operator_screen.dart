import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/bulky_constants.dart';
import '../../../core/domain/models/bulky_order.dart';
import '../../../core/theme/bulky_colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../../orders/providers/orders_provider.dart';

/// Screen for dispatch operators to oversee all bulky orders,
/// approve AI inspections, and assign collection vehicles & drivers.
class BulkyOperatorScreen extends StatefulWidget {
  const BulkyOperatorScreen({super.key});

  @override
  State<BulkyOperatorScreen> createState() => _BulkyOperatorScreenState();
}

class _BulkyOperatorScreenState extends State<BulkyOperatorScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final ordersProvider = context.watch<OrdersProvider>();
    final pendingOrders = ordersProvider.pendingDispatchOrders;
    final assignedOrders = ordersProvider.driverAssignedOrders;
    final allOrders = ordersProvider.orders;

    return Scaffold(
      backgroundColor: BulkyColors.background,
      appBar: AppBar(
        title: const Text(
          'Trung Tâm Điều Phối VSMT',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        elevation: 0,
        backgroundColor: BulkyColors.surface,
        foregroundColor: BulkyColors.textPrimary,
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Tải lại danh sách',
            onPressed: () => ordersProvider.loadOrders(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: BulkyColors.primary,
          unselectedLabelColor: BulkyColors.textSecondary,
          indicatorColor: BulkyColors.primary,
          tabs: [
            Tab(text: 'Chờ xếp xe (${pendingOrders.length})'),
            Tab(text: 'Trên tuyến (${assignedOrders.length})'),
            Tab(text: 'Tất cả (${allOrders.length})'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Operator Identity & Live KPI banner
          _buildOperatorKpiHeader(auth, ordersProvider),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildPendingDispatchTab(context, ordersProvider, pendingOrders),
                _buildAssignedTab(context, ordersProvider, assignedOrders),
                _buildAllOrdersTab(context, allOrders),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOperatorKpiHeader(AuthProvider auth, OrdersProvider ordersProvider) {
    final user = auth.currentUser;
    final staffCode = user?.staffCode ?? 'NV-DP01';
    final name = user?.name ?? 'Trần Thị Mai';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: BulkyColors.surface,
        border: const Border(
          bottom: BorderSide(color: BulkyColors.border),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: BulkyColors.primaryLight.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.admin_panel_settings_rounded,
                    size: 20, color: BulkyColors.primary),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$name ($staffCode)',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: BulkyColors.textPrimary,
                      ),
                    ),
                    const Text(
                      'Tổ Điều Phối Thu Gom Rác Cồng Kềnh Q.1',
                      style: TextStyle(
                        fontSize: 11,
                        color: BulkyColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: BulkyColors.successBg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.circle, size: 8, color: BulkyColors.success),
                    SizedBox(width: 4),
                    Text(
                      'Trực tuyến',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: BulkyColors.success,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildKpiCard(
                title: 'Chờ xếp xe',
                count: ordersProvider.pendingDispatchOrders.length,
                color: BulkyColors.warning,
                bgColor: BulkyColors.warningBg,
              ),
              const SizedBox(width: 8),
              _buildKpiCard(
                title: 'Đang di chuyển',
                count: ordersProvider.driverAssignedOrders.length,
                color: BulkyColors.primary,
                bgColor: BulkyColors.primaryLight.withValues(alpha: 0.12),
              ),
              const SizedBox(width: 8),
              _buildKpiCard(
                title: 'Đã hoàn tất',
                count: ordersProvider.completedOrders.length,
                color: BulkyColors.success,
                bgColor: BulkyColors.successBg,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildKpiCard({
    required String title,
    required int count,
    required Color color,
    required Color bgColor,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '$count',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              title,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPendingDispatchTab(
    BuildContext context,
    OrdersProvider ordersProvider,
    List<BulkyOrder> orders,
  ) {
    if (orders.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.check_circle_outline_rounded,
                  size: 56, color: BulkyColors.success.withValues(alpha: 0.7)),
              const SizedBox(height: 12),
              const Text(
                'Không có đơn hàng nào chờ điều phối',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              const Text(
                'Tất cả các đơn đã cọc đều đã được chỉ định xe và tài xế thu gom.',
                style: TextStyle(fontSize: 13, color: BulkyColors.textSecondary),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: orders.length,
      itemBuilder: (context, index) {
        final order = orders[index];
        return _buildPendingOrderCard(context, ordersProvider, order);
      },
    );
  }

  Widget _buildPendingOrderCard(
    BuildContext context,
    OrdersProvider ordersProvider,
    BulkyOrder order,
  ) {
    return Card(
      key: Key('operator_pending_card_${order.id}'),
      margin: const EdgeInsets.only(bottom: 14),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: BulkyColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  order.id,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: BulkyColors.textPrimary,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: BulkyColors.successBg,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: BulkyColors.success.withValues(alpha: 0.3)),
                  ),
                  child: const Text(
                    'Đã đặt cọc giữ chỗ',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: BulkyColors.success,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 16, color: BulkyColors.primary),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    order.address,
                    style: const TextStyle(fontSize: 13, color: BulkyColors.textPrimary),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.person_outline_rounded, size: 16, color: BulkyColors.textSecondary),
                const SizedBox(width: 6),
                Text(
                  '${order.contactName ?? "Khách hàng"} • ${order.contactPhone ?? "Chưa có SĐT"}',
                  style: const TextStyle(fontSize: 12, color: BulkyColors.textSecondary),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: BulkyColors.background,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Vật dụng thu gom (${order.items.length} món):',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: BulkyColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  ...order.items.map(
                    (it) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Text(
                        '• ${it.displayName} (x${it.quantity}) - ${it.material.emoji} ${it.material.shortLabel}',
                        style: const TextStyle(fontSize: 12, color: BulkyColors.textSecondary),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                key: Key('assign_driver_button_${order.id}'),
                onPressed: () async {
                  await ordersProvider.assignDriverAndSchedule(
                    order.id,
                    vehiclePlate: '51C-889.21',
                  );
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Đã chỉ định xe tải 51C-889.21 (Tài xế Nguyễn Văn Hùng) cho đơn ${order.id}!',
                        ),
                        backgroundColor: BulkyColors.primary,
                      ),
                    );
                  }
                },
                icon: const Icon(Icons.local_shipping_rounded, size: 18),
                label: const Text('Chỉ định xe tải 51C-889.21 & Lên lịch'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: BulkyColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAssignedTab(
    BuildContext context,
    OrdersProvider ordersProvider,
    List<BulkyOrder> orders,
  ) {
    if (orders.isEmpty) {
      return const Center(
        child: Text(
          'Hiện không có đơn nào đang trên tuyến thu gom.',
          style: TextStyle(color: BulkyColors.textSecondary),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: orders.length,
      itemBuilder: (context, index) {
        final order = orders[index];
        final isEnRoute = order.status == BulkyOrderStatus.IN_PROGRESS;

        return Card(
          key: Key('operator_assigned_card_${order.id}'),
          margin: const EdgeInsets.only(bottom: 14),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(
              color: isEnRoute ? BulkyColors.primary : BulkyColors.border,
              width: isEnRoute ? 1.5 : 1.0,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      order.id,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isEnRoute
                            ? const Color(0xFFEEF2FF)
                            : BulkyColors.primaryLight.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        order.status.displayName,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: isEnRoute ? const Color(0xFF6366F1) : BulkyColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: BulkyColors.background,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.directions_car_rounded, size: 20, color: BulkyColors.primary),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Xe phụ trách: ${order.vehiclePlate ?? "51C-889.21"}',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                            const Text(
                              'Tài xế: Nguyễn Văn Hùng • 0909.123.456',
                              style: TextStyle(fontSize: 11, color: BulkyColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Địa chỉ: ${order.address}',
                  style: const TextStyle(fontSize: 12, color: BulkyColors.textSecondary),
                ),
                const SizedBox(height: 10),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton.icon(
                    onPressed: () {
                      Navigator.pushNamed(context, '/order-detail', arguments: order.id);
                    },
                    icon: const Icon(Icons.visibility_outlined, size: 16),
                    label: const Text('Xem chi tiết đơn'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildAllOrdersTab(BuildContext context, List<BulkyOrder> orders) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: orders.length,
      itemBuilder: (context, index) {
        final order = orders[index];
        return ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          tileColor: BulkyColors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: const BorderSide(color: BulkyColors.border),
          ),
          title: Text(order.id, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          subtitle: Text('${order.pickupDate} • ${order.address}', maxLines: 1, overflow: TextOverflow.ellipsis),
          trailing: Text(
            order.status.displayName,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: BulkyColors.primary),
          ),
          onTap: () {
            Navigator.pushNamed(context, '/order-detail', arguments: order.id);
          },
        );
      },
    );
  }
}
