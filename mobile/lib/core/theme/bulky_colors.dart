import 'package:flutter/material.dart';

class BulkyColors {
  static const Color primary = Color(0xFF1D4ED8);
  static const Color primaryLight = Color(0xFF3B82F6);
  static const Color primaryDark = Color(0xFF1E40AF);

  static const Color background = Color(0xFFF8FAFC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFE2E8F0);

  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF64748B);

  static const Color success = Color(0xFF16A34A);
  static const Color successBg = Color(0xFFDCFCE7);
  static const Color warning = Color(0xFFD97706);
  static const Color warningBg = Color(0xFFFEF3C7);
  static const Color error = Color(0xFFDC2626);
  static const Color errorBg = Color(0xFFFEE2E2);

  // Category Bounding Box Colors
  static const Color boxSofa = Color(0xFF10B981);
  static const Color boxMattress = Color(0xFF2563EB);
  static const Color boxCabinet = Color(0xFF9333EA);
  static const Color boxTable = Color(0xFFF59E0B);
  static const Color boxOther = Color(0xFF475569);
  static const Color boxHazardous = Color(0xFFEF4444);

  /// Formats VND amount with dot thousands separator, e.g. 150000 -> "150.000 đ"
  static String formatCurrency(int amount) {
    final isNegative = amount < 0;
    final str = amount.abs().toString();
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) {
        buffer.write('.');
      }
      buffer.write(str[i]);
    }
    return '${isNegative ? '-' : ''}${buffer.toString()} đ';
  }
}
