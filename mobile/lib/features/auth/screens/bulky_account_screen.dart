import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/bulky_colors.dart';
import '../providers/auth_provider.dart';

/// Screen for citizen profile, account settings, login and logout.
class BulkyAccountScreen extends StatefulWidget {
  const BulkyAccountScreen({super.key});

  @override
  State<BulkyAccountScreen> createState() => _BulkyAccountScreenState();
}

class _BulkyAccountScreenState extends State<BulkyAccountScreen> {
  final _phoneController = TextEditingController(text: '0912.345.678');
  final _passwordController = TextEditingController(text: '123456');
  bool _obscurePassword = true;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogout(BuildContext context, AuthProvider authProvider) {
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.logout_rounded, color: BulkyColors.error, size: 24),
            SizedBox(width: 8),
            Text('Đăng Xuất', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Text(
          'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng Smartbin Bulky?',
          style: TextStyle(fontSize: 14, color: BulkyColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('Hủy', style: TextStyle(color: BulkyColors.textSecondary)),
          ),
          ElevatedButton(
            key: const Key('confirm_logout_button'),
            style: ElevatedButton.styleFrom(
              backgroundColor: BulkyColors.error,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () async {
              Navigator.pop(dialogCtx);
              await authProvider.logout();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Đã đăng xuất tài khoản thành công.'),
                    backgroundColor: BulkyColors.textPrimary,
                    duration: Duration(seconds: 2),
                  ),
                );
              }
            },
            child: const Text('Đăng xuất'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.currentUser;
    final isAuthenticated = auth.isAuthenticated;

    return Scaffold(
      backgroundColor: BulkyColors.background,
      appBar: AppBar(
        title: Text(
          isAuthenticated ? 'Tài Khoản Công Dân' : 'Đăng Nhập',
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        elevation: 0,
        backgroundColor: BulkyColors.surface,
        foregroundColor: BulkyColors.textPrimary,
        centerTitle: false,
      ),
      body: auth.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: isAuthenticated && user != null
                  ? _buildLoggedInView(context, auth, user)
                  : _buildLoggedOutView(context, auth),
            ),
    );
  }

  Widget _buildLoggedInView(BuildContext context, AuthProvider auth, user) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // 1. Citizen Profile Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: BulkyColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: BulkyColors.border),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 32,
                backgroundColor: BulkyColors.primaryLight.withValues(alpha: 0.2),
                child: Text(
                  user.name.isNotEmpty ? user.name[0] : 'U',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: BulkyColors.primary,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            user.name,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: BulkyColors.textPrimary,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Icon(Icons.verified, size: 16, color: BulkyColors.primary),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user.phone,
                      style: const TextStyle(
                        fontSize: 13,
                        color: BulkyColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      user.email,
                      style: const TextStyle(
                        fontSize: 12,
                        color: BulkyColors.textSecondary,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // 2. Household & Points Summary
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: BulkyColors.successBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: BulkyColors.success.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.home_work_outlined, size: 18, color: BulkyColors.success),
                        SizedBox(width: 6),
                        Text(
                          'Mã hộ gia đình',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: BulkyColors.success,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      user.householdId,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: BulkyColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: BulkyColors.primaryLight.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: BulkyColors.primary.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.eco_rounded, size: 18, color: BulkyColors.primary),
                        SizedBox(width: 6),
                        Text(
                          'Điểm Xanh tích lũy',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: BulkyColors.primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${user.rewardPoints} điểm (Bạc)',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: BulkyColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // 3. Registered Service Location Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: BulkyColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: BulkyColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.location_on_outlined, size: 18, color: BulkyColors.primary),
                  SizedBox(width: 8),
                  Text(
                    'Địa chỉ thu gom mặc định',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: BulkyColors.textPrimary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                user.defaultAddress,
                style: const TextStyle(
                  fontSize: 13,
                  color: BulkyColors.textPrimary,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // 4. Utility Options
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: BulkyColors.border),
          ),
          child: Material(
            color: BulkyColors.surface,
            borderRadius: BorderRadius.circular(14),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.support_agent_rounded, color: BulkyColors.primary),
                  title: const Text('Tổng đài hỗ trợ Smartbin', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  subtitle: const Text('1900 6868 (Miễn phí 24/7)', style: TextStyle(fontSize: 12)),
                  trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: BulkyColors.textSecondary),
                  onTap: () {},
                ),
                const Divider(height: 1, indent: 56),
                ListTile(
                  leading: const Icon(Icons.policy_outlined, color: BulkyColors.primary),
                  title: const Text('Chính sách thu gom rác cồng kềnh', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  subtitle: const Text('Biểu cước niêm yết & Cam kết dung sai ±15%', style: TextStyle(fontSize: 12)),
                  trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: BulkyColors.textSecondary),
                  onTap: () {},
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        // 5. Logout Button
        ElevatedButton.icon(
          key: const Key('logout_button'),
          onPressed: () => _handleLogout(context, auth),
          icon: const Icon(Icons.logout_rounded, size: 18),
          label: const Text('Đăng Xuất Khỏi Thiết Bị'),
          style: ElevatedButton.styleFrom(
            backgroundColor: BulkyColors.error.withValues(alpha: 0.1),
            foregroundColor: BulkyColors.error,
            elevation: 0,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: BulkyColors.error.withValues(alpha: 0.3)),
            ),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildLoggedOutView(BuildContext context, AuthProvider auth) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 20),
        Center(
          child: Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: BulkyColors.primaryLight.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.recycling_rounded,
              size: 40,
              color: BulkyColors.primary,
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Đăng Nhập Tài Khoản Công Dân',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: BulkyColors.textPrimary,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 6),
        const Text(
          'Đăng nhập để theo dõi lịch thu gom rác cồng kềnh và tích lũy Điểm Xanh môi trường.',
          style: TextStyle(fontSize: 13, color: BulkyColors.textSecondary, height: 1.4),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 28),

        // Form fields
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: BulkyColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: BulkyColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                key: const Key('login_phone_input'),
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Số điện thoại công dân',
                  prefixIcon: Icon(Icons.phone_iphone_rounded, size: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                key: const Key('login_password_input'),
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  labelText: 'Mật khẩu',
                  prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                  border: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_off : Icons.visibility,
                      size: 20,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscurePassword = !_obscurePassword;
                      });
                    },
                  ),
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                key: const Key('login_submit_button'),
                onPressed: () async {
                  final success = await auth.login(
                    _phoneController.text,
                    _passwordController.text,
                  );
                  if (context.mounted && success) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Xin chào, ${auth.currentUser?.name}! Đăng nhập thành công.'),
                        backgroundColor: BulkyColors.success,
                      ),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  backgroundColor: BulkyColors.primary,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Đăng Nhập', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                key: const Key('login_quick_demo_button'),
                onPressed: () async {
                  await auth.loginDemo();
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Đã đăng nhập tài khoản mẫu: Nguyễn Văn An'),
                        backgroundColor: BulkyColors.primary,
                      ),
                    );
                  }
                },
                icon: const Icon(Icons.flash_on_rounded, size: 18),
                label: const Text('Đăng nhập nhanh (Tài khoản mẫu: Nguyễn Văn An)'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  side: const BorderSide(color: BulkyColors.primary),
                  foregroundColor: BulkyColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}
