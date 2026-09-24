import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/theme/bulky_colors.dart';

/// Countdown timer widget showing remaining slot reservation hold time.
class CountdownTimerWidget extends StatefulWidget {
  final Duration initialDuration;
  final VoidCallback? onExpired;

  const CountdownTimerWidget({
    super.key,
    this.initialDuration = const Duration(minutes: 15),
    this.onExpired,
  });

  @override
  State<CountdownTimerWidget> createState() => _CountdownTimerWidgetState();
}

class _CountdownTimerWidgetState extends State<CountdownTimerWidget> {
  late int _remainingSeconds;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _remainingSeconds = widget.initialDuration.inSeconds;
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_remainingSeconds > 0) {
        setState(() {
          _remainingSeconds--;
        });
        if (_remainingSeconds == 0) {
          timer.cancel();
          widget.onExpired?.call();
        }
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _formatDuration(int totalSeconds) {
    final minutes = totalSeconds ~/ 60;
    final seconds = totalSeconds % 60;
    final mm = minutes.toString().padLeft(2, '0');
    final ss = seconds.toString().padLeft(2, '0');
    return '$mm:$ss';
  }

  @override
  Widget build(BuildContext context) {
    final isUrgent = _remainingSeconds < 180; // Under 3 minutes
    final color = isUrgent ? BulkyColors.error : BulkyColors.warning;
    final bgColor = isUrgent ? BulkyColors.errorBg : BulkyColors.warningBg;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isUrgent ? Icons.timer_outlined : Icons.access_time_filled_rounded,
            size: 18,
            color: color,
          ),
          const SizedBox(width: 6),
          Text(
            _formatDuration(_remainingSeconds),
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
