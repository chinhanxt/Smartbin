import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bulky_mobile/main.dart';
import 'package:bulky_mobile/core/theme/bulky_colors.dart';

void main() {
  testWidgets('Smartbin Bulky home widget smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const BulkyApp());

    // Verify AppBar title is displayed
    expect(find.text('Smartbin - Thu Gom Rác Cồng Kềnh'), findsOneWidget);

    // Verify intro message is displayed
    expect(find.text('Dịch Vụ Thu Gom Rác Cồng Kềnh'), findsOneWidget);

    // Verify recycling icon is displayed
    expect(find.byIcon(Icons.recycling_rounded), findsOneWidget);

    // Verify BulkyColors palette constants
    expect(BulkyColors.primary, const Color(0xFF1D4ED8));
    expect(BulkyColors.success, const Color(0xFF16A34A));
    expect(BulkyColors.background, const Color(0xFFF8FAFC));
  });
}
