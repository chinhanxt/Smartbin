/**
 * SoundAlert.js
 * Web Audio API synthesizer for the Smart Waste Bin IoT Simulation.
 * Generates procedural robotic servo motor sounds, bottle impact clatter,
 * and high-priority full-bin emergency buzzer alarms with zero external audio assets.
 */

export class SoundAlert {
  constructor(options = {}) {
    this.enabled = options.enabled !== undefined ? Boolean(options.enabled) : true;
    this.ctx = null;
    this.masterGain = null;

    this._isAlarmActive = false;
    this._alarmInterval = null;
    this._alarmStep = 0;
    this._activeAlarmOsc = null;
    this._activeAlarmGain = null;

    // Register user interaction listeners to safely unlock/resume AudioContext
    this._setupUserGestureUnlock();
  }

  /**
   * Initializes or safely resumes the Web Audio Context upon user interaction.
   * Browsers block autoplay until an explicit user gesture occurs.
   * @private
   */
  _ensureAudioContext() {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        console.warn('[SoundAlert] Web Audio API is not supported in this environment.');
        return null;
      }
      try {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      } catch (err) {
        console.warn('[SoundAlert] Failed to initialize AudioContext:', err);
        return null;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * Attaches low-overhead listeners to unlock AudioContext on first interaction.
   * @private
   */
  _setupUserGestureUnlock() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  /**
   * Toggles sound output on or off.
   * If sound is disabled while alarm is active, halts alarm playback.
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled && this._isAlarmActive) {
      this._silenceAlarmNodes();
    }
  }

  /**
   * Getter indicating whether the emergency buzzer alarm is currently active.
   * @returns {boolean}
   */
  get isAlarmActive() {
    return this._isAlarmActive;
  }

  /**
   * Plays a robotic servo motor sweep sound when the bin lid opens.
   * Frequency glides from 400Hz up to 800Hz with a resonant bandpass filter.
   */
  playServoOpen() {
    if (!this.enabled) return;
    const ctx = this._ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.26;

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      // Sawtooth wave captures the mechanical harmonics of small electric servo gears
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + duration * 0.85);

      // Resonant bandpass filter shapes the mechanical motor housing acoustics
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(620, now);
      filter.frequency.linearRampToValueAtTime(850, now + duration);
      filter.Q.setValueAtTime(3.8, now);

      // Volume envelope with subtle attack and smooth decay
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gain.gain.setValueAtTime(0.18, now + duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);

      osc.onended = () => {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    } catch (e) {
      console.warn('[SoundAlert] Error in playServoOpen:', e);
    }
  }

  /**
   * Plays a reverse robotic servo motor sweep sound when the bin lid closes.
   * Frequency glides downward from 800Hz to 400Hz with a resonant bandpass filter.
   */
  playServoClose() {
    if (!this.enabled) return;
    const ctx = this._ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.26;

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + duration * 0.85);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(850, now);
      filter.frequency.linearRampToValueAtTime(600, now + duration);
      filter.Q.setValueAtTime(3.8, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gain.gain.setValueAtTime(0.18, now + duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);

      osc.onended = () => {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    } catch (e) {
      console.warn('[SoundAlert] Error in playServoClose:', e);
    }
  }

  /**
   * Plays a soft impact clatter sound when a plastic bottle drops into the bin.
   * Synthesized using a low-frequency oscillator thud combined with filtered noise clatter.
   */
  playBottleDrop() {
    if (!this.enabled) return;
    const ctx = this._ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Low oscillator body thud (hollow plastic bin resonance)
      const thudOsc = ctx.createOscillator();
      const thudGain = ctx.createGain();

      thudOsc.type = 'triangle';
      thudOsc.frequency.setValueAtTime(140, now);
      thudOsc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

      thudGain.gain.setValueAtTime(0.28, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      thudOsc.connect(thudGain);
      thudGain.connect(this.masterGain);

      thudOsc.start(now);
      thudOsc.stop(now + 0.15);

      thudOsc.onended = () => {
        thudOsc.disconnect();
        thudGain.disconnect();
      };

      // 2. Filtered noise burst (plastic bottle surface impact rattle)
      const noiseDuration = 0.11;
      const bufferSize = Math.floor(ctx.sampleRate * noiseDuration);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        // Decaying white noise
        const decay = 1 - i / bufferSize;
        output[i] = (Math.random() * 2 - 1) * decay;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2200, now);
      noiseFilter.Q.setValueAtTime(2.2, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.22, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDuration);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noiseSource.start(now);
      noiseSource.stop(now + noiseDuration);

      noiseSource.onended = () => {
        noiseSource.disconnect();
        noiseFilter.disconnect();
        noiseGain.disconnect();
      };
    } catch (e) {
      console.warn('[SoundAlert] Error in playBottleDrop:', e);
    }
  }

  /**
   * Starts pulsing emergency buzzer alarm when trash can is full.
   * Alternates between 880Hz and 1100Hz beeps every 200ms.
   */
  startAlarm() {
    if (this._isAlarmActive) return;
    this._isAlarmActive = true;
    this._alarmStep = 0;

    const playBeep = () => {
      if (!this._isAlarmActive || !this.enabled) return;
      const ctx = this._ensureAudioContext();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;
        const duration = 0.13;
        const freq = this._alarmStep % 2 === 0 ? 880 : 1100;
        this._alarmStep++;

        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        // Square wave filtered for an authentic industrial piezoelectric buzzer sound
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.015);
        gain.gain.setValueAtTime(0.22, now + duration - 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration);

        this._activeAlarmOsc = osc;
        this._activeAlarmGain = gain;

        osc.onended = () => {
          if (this._activeAlarmOsc === osc) {
            this._activeAlarmOsc = null;
            this._activeAlarmGain = null;
          }
          osc.disconnect();
          filter.disconnect();
          gain.disconnect();
        };
      } catch (e) {
        console.warn('[SoundAlert] Error in alarm beep:', e);
      }
    };

    // Trigger immediate first beep, then recurring every 200ms
    playBeep();
    this._alarmInterval = setInterval(playBeep, 200);
  }

  /**
   * Stops the emergency buzzer alarm and cleans up recurring timers.
   */
  stopAlarm() {
    this._isAlarmActive = false;
    if (this._alarmInterval) {
      clearInterval(this._alarmInterval);
      this._alarmInterval = null;
    }
    this._silenceAlarmNodes();
    this._alarmStep = 0;
  }

  /**
   * Immediately silences any ongoing buzzer tone.
   * @private
   */
  _silenceAlarmNodes() {
    if (this._activeAlarmOsc) {
      try {
        if (this.ctx && this._activeAlarmGain) {
          this._activeAlarmGain.gain.setValueAtTime(0, this.ctx.currentTime);
        }
        this._activeAlarmOsc.stop();
        this._activeAlarmOsc.disconnect();
      } catch (e) {
        // Ignored if already ended
      }
      this._activeAlarmOsc = null;
      this._activeAlarmGain = null;
    }
  }
}
