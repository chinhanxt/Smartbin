import 'package:flutter/material.dart';
import 'core/theme/bulky_colors.dart';
import 'core/theme/bulky_theme.dart';

void main() {
  runApp(const BulkyApp());
}

class BulkyApp extends StatelessWidget {
  const BulkyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smartbin Bulky',
      theme: BulkyTheme.lightTheme,
      home: const BulkyHomeScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class BulkyHomeScreen extends StatelessWidget {
  const BulkyHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Smartbin - Thu Gom Rác Cồng Kềnh'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: BulkyColors.primaryLight.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.recycling_rounded,
                  size: 48,
                  color: BulkyColors.primary,
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Dịch Vụ Thu Gom Rác Cồng Kềnh',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: BulkyColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              const Text(
                'Hỗ trợ đăng ký thu gom đồ gỗ, nệm sofa, thiết bị điện tử gia dụng tại nhà nhanh chóng và tiện lợi.',
                style: TextStyle(
                  fontSize: 14,
                  color: BulkyColors.textSecondary,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
