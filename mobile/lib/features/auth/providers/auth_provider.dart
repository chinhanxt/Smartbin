import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/citizen_user.dart';

/// Provider managing Citizen authentication state (Login / Logout / Profile).
class AuthProvider extends ChangeNotifier {
  static const String _userStorageKey = 'smartbin_bulky_current_user';

  CitizenUser? _currentUser;
  bool _isLoading = false;

  AuthProvider({CitizenUser? initialUser}) : _currentUser = initialUser ?? CitizenUser.demoUser;

  CitizenUser? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;

  /// Loads stored user from local storage or defaults to demo user.
  Future<void> loadSession() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final userJsonStr = prefs.getString(_userStorageKey);
      if (userJsonStr != null) {
        final data = jsonDecode(userJsonStr) as Map<String, dynamic>;
        _currentUser = CitizenUser.fromJson(data);
      } else {
        // Default to demo user for seamless out-of-the-box experience
        _currentUser = CitizenUser.demoUser;
        await _saveUserToPrefs(_currentUser!);
      }
    } catch (_) {
      _currentUser = CitizenUser.demoUser;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Logs in citizen with phone and password or OTP.
  Future<bool> login(String phone, String password) async {
    _isLoading = true;
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 400)); // simulate auth latency

    final trimmedPhone = phone.trim();
    if (trimmedPhone.isEmpty) {
      _isLoading = false;
      notifyListeners();
      return false;
    }

    _currentUser = CitizenUser(
      id: 'user-${trimmedPhone.replaceAll(RegExp(r'\D'), '')}',
      name: trimmedPhone == '0912.345.678' || trimmedPhone == '0912345678'
          ? 'Nguyễn Văn An'
          : 'Công dân $trimmedPhone',
      phone: trimmedPhone,
      email: 'congdan.${trimmedPhone.replaceAll(RegExp(r'\D'), '')}@smartbin.vn',
      defaultAddress: '123 Nguyễn Thị Minh Khai, P. Bến Nghé, Q.1, TP.HCM',
      householdId: 'HH-${trimmedPhone.length >= 4 ? trimmedPhone.substring(trimmedPhone.length - 4) : "1234"}',
      rewardPoints: 120,
    );

    await _saveUserToPrefs(_currentUser!);
    _isLoading = false;
    notifyListeners();
    return true;
  }

  /// 1-Click quick login for demo user.
  Future<void> loginDemo() async {
    _isLoading = true;
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 200));
    _currentUser = CitizenUser.demoUser;
    await _saveUserToPrefs(_currentUser!);

    _isLoading = false;
    notifyListeners();
  }

  /// Logs out the citizen and clears local session.
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_userStorageKey);
    } catch (_) {}

    _currentUser = null;
    _isLoading = false;
    notifyListeners();
  }

  Future<void> _saveUserToPrefs(CitizenUser user) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_userStorageKey, jsonEncode(user.toJson()));
    } catch (_) {}
  }
}
