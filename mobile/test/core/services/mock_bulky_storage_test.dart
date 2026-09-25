import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:bulky_mobile/core/constants/bulky_constants.dart';
import 'package:bulky_mobile/core/domain/models/bulky_item.dart';
import 'package:bulky_mobile/core/domain/models/bulky_order.dart';
import 'package:bulky_mobile/core/domain/pricing/pricing_engine.dart';
import 'package:bulky_mobile/core/services/storage/mock_bulky_storage.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late MockBulkyStorage storage;

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    storage = MockBulkyStorage();
  });

  group('MockBulkyStorage', () {
    test('1. seedInitialOrdersIfEmpty populates realistic Vietnamese orders when empty', () async {
      final initialOrders = await storage.getOrders();
      expect(initialOrders, isEmpty);

      await storage.seedInitialOrdersIfEmpty();

      final orders = await storage.getOrders();
      expect(orders.length, 3);

      // Order 1: CONFIRMED awaiting dispatch
      final confirmedOrder = orders.firstWhere(
        (o) => o.status == BulkyOrderStatus.CONFIRMED,
      );
      expect(confirmedOrder.paymentStatus, BulkyPaymentStatus.DEPOSIT_HELD);
      expect(confirmedOrder.address, contains('Hồ Chí Minh'));

      // Order 2: SCHEDULED with deposit held
      final scheduledOrder = orders.firstWhere(
        (o) => o.status == BulkyOrderStatus.SCHEDULED,
      );
      expect(scheduledOrder.paymentStatus, BulkyPaymentStatus.DEPOSIT_HELD);
      expect(scheduledOrder.vehiclePlate, isNotNull);
      expect(scheduledOrder.address, contains('Hồ Chí Minh'));
      expect(scheduledOrder.items.isNotEmpty, isTrue);
      expect(scheduledOrder.quote.minVnd, greaterThan(0));

      // Order 3: COMPLETED
      final completedOrder = orders.firstWhere(
        (o) => o.status == BulkyOrderStatus.COMPLETED,
      );
      expect(completedOrder.paymentStatus, BulkyPaymentStatus.PAID);
      expect(completedOrder.address, contains('Hồ Chí Minh'));
      expect(completedOrder.items.isNotEmpty, isTrue);

      // Calling seed again should NOT duplicate orders
      await storage.seedInitialOrdersIfEmpty();
      final reloadedOrders = await storage.getOrders();
      expect(reloadedOrders.length, 3);
    });

    test('2. saveOrder saves and updates orders in storage', () async {
      final item = const BulkyItem(
        id: 'item-test-1',
        category: BulkyCategory.SOFA,
        displayName: 'Sofa góc nỉ',
        quantity: 1,
        material: MaterialType.STANDARD,
      );

      final quote = PricingEngine.calculateQuote(items: [item]);

      final order = BulkyOrder(
        id: 'order-test-101',
        items: [item],
        quote: quote,
        address: '72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
        pickupDate: '2026-09-28',
        status: BulkyOrderStatus.AWAITING_PAYMENT,
        paymentStatus: BulkyPaymentStatus.UNPAID,
        createdAt: DateTime(2026, 9, 24, 10, 0),
        contactName: 'Phạm Minh Tuấn',
        contactPhone: '0988776655',
      );

      await storage.saveOrder(order);

      final fetchedOrders = await storage.getOrders();
      expect(fetchedOrders.length, 1);
      expect(fetchedOrders.first.id, 'order-test-101');
      expect(fetchedOrders.first.contactName, 'Phạm Minh Tuấn');

      // Update the existing order
      final updatedOrder = order.copyWith(
        contactName: 'Phạm Minh Tuấn (VIP)',
        address: '74 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      );
      await storage.saveOrder(updatedOrder);

      final afterUpdate = await storage.getOrders();
      expect(afterUpdate.length, 1);
      expect(afterUpdate.first.contactName, 'Phạm Minh Tuấn (VIP)');
      expect(afterUpdate.first.address, contains('74 Lê Thánh Tôn'));
    });

    test('3. getOrderById retrieves specific order or null if not found', () async {
      await storage.seedInitialOrdersIfEmpty();
      final allOrders = await storage.getOrders();
      final targetId = allOrders.first.id;

      final found = await storage.getOrderById(targetId);
      expect(found, isNotNull);
      expect(found!.id, targetId);

      final notFound = await storage.getOrderById('non-existent-order-id');
      expect(notFound, isNull);
    });

    test('4. updateOrderStatus updates status, paymentStatus and persists changes', () async {
      final item = const BulkyItem(
        id: 'item-test-2',
        category: BulkyCategory.MATTRESS,
        displayName: 'Đệm cao su Kymdan',
        quantity: 1,
        material: MaterialType.STANDARD,
      );
      final quote = PricingEngine.calculateQuote(items: [item]);

      final order = BulkyOrder(
        id: 'order-status-test',
        items: [item],
        quote: quote,
        address: '10 Hai Bà Trưng, Quận 1',
        pickupDate: '2026-09-27',
        status: BulkyOrderStatus.AWAITING_PAYMENT,
        paymentStatus: BulkyPaymentStatus.UNPAID,
        createdAt: DateTime(2026, 9, 24, 14, 0),
      );

      await storage.saveOrder(order);

      // Transition to CONFIRMED with DEPOSIT_HELD
      await storage.updateOrderStatus(
        'order-status-test',
        BulkyOrderStatus.CONFIRMED,
        paymentStatus: BulkyPaymentStatus.DEPOSIT_HELD,
      );

      final fetched = await storage.getOrderById('order-status-test');
      expect(fetched, isNotNull);
      expect(fetched!.status, BulkyOrderStatus.CONFIRMED);
      expect(fetched.paymentStatus, BulkyPaymentStatus.DEPOSIT_HELD);
      expect(fetched.depositPaidAt, isNotNull);
    });
  });
}
