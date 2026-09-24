/// Model representing a logged-in citizen user in Smartbin Bulky mobile app.
class CitizenUser {
  final String id;
  final String name;
  final String phone;
  final String email;
  final String defaultAddress;
  final String householdId;
  final int rewardPoints;

  const CitizenUser({
    required this.id,
    required this.name,
    required this.phone,
    required this.email,
    required this.defaultAddress,
    required this.householdId,
    this.rewardPoints = 120,
  });

  CitizenUser copyWith({
    String? id,
    String? name,
    String? phone,
    String? email,
    String? defaultAddress,
    String? householdId,
    int? rewardPoints,
  }) {
    return CitizenUser(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      defaultAddress: defaultAddress ?? this.defaultAddress,
      householdId: householdId ?? this.householdId,
      rewardPoints: rewardPoints ?? this.rewardPoints,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
        'email': email,
        'defaultAddress': defaultAddress,
        'householdId': householdId,
        'rewardPoints': rewardPoints,
      };

  factory CitizenUser.fromJson(Map<String, dynamic> json) => CitizenUser(
        id: json['id'] as String? ?? 'user-citizen-01',
        name: json['name'] as String? ?? 'Nguyễn Văn An',
        phone: json['phone'] as String? ?? '0912.345.678',
        email: json['email'] as String? ?? 'nguyenvanan@gmail.com',
        defaultAddress: json['defaultAddress'] as String? ??
            '123 Nguyễn Thị Minh Khai, P. Bến Nghé, Q.1, TP.HCM',
        householdId: json['householdId'] as String? ?? 'HH-78921',
        rewardPoints: (json['rewardPoints'] as num?)?.toInt() ?? 120,
      );

  static const CitizenUser demoUser = CitizenUser(
    id: 'user-citizen-01',
    name: 'Nguyễn Văn An',
    phone: '0912.345.678',
    email: 'nguyenvanan@gmail.com',
    defaultAddress: '123 Nguyễn Thị Minh Khai, P. Bến Nghé, Q.1, TP.HCM',
    householdId: 'HH-78921',
    rewardPoints: 120,
  );
}
