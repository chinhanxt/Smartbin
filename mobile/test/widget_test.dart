import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bulky_mobile/main.dart';
import 'package:bulky_mobile/core/theme/bulky_colors.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('Smartbin Bulky app smoke test and bottom navigation', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const BulkyApp());
    await tester.pumpAndSettle();

    // Verify Wizard AppBar title is displayed by default on Tab 0
    expect(find.text('Đặt Thu Gom Rác Cồng Kềnh'), findsOneWidget);

    // Verify BottomNavigationBar tabs are displayed
    expect(find.text('Đặt lịch'), findsOneWidget);
    expect(find.text('Đơn của tôi'), findsOneWidget);
    expect(find.byIcon(Icons.add_circle), findsOneWidget);
    expect(find.byIcon(Icons.receipt_long_outlined), findsOneWidget);

    // Switch to Tab 1: Đơn của tôi
    await tester.tap(find.text('Đơn của tôi'));
    await tester.pumpAndSettle();

    // Verify Orders screen is visible
    expect(find.text('Đơn Của Tôi'), findsOneWidget);

    // Switch to Tab 2: Tài khoản
    await tester.tap(find.text('Tài khoản'));
    await tester.pumpAndSettle();

    // Verify Account screen is visible
    expect(find.text('Tài Khoản Công Dân'), findsOneWidget);
    expect(find.text('Nguyễn Văn An'), findsOneWidget);

    // Switch back to Tab 0: Đặt lịch
    await tester.tap(find.text('Đặt lịch'));
    await tester.pumpAndSettle();

    expect(find.text('Đặt Thu Gom Rác Cồng Kềnh'), findsOneWidget);

    // Verify BulkyColors palette constants
    expect(BulkyColors.primary, const Color(0xFF059669));
    expect(BulkyColors.success, const Color(0xFF16A34A));
    expect(BulkyColors.background, const Color(0xFFF6FBF8));
  });
}
