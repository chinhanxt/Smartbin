/**
 * Controls - User Interaction Handler
 * Handles waste spawning, auto-fill loop, and resetting the bin.
 */

export class Controls {
  constructor(callbacks = {}) {
    this.callbacks = {
      onDropBottle: () => {},
      onDropBag: () => {},
      onToggleAutoFill: () => {},
      onResetBin: () => {},
      ...callbacks
    };

    this.isAutoFillActive = false;
    this.initListeners();
  }

  initListeners() {
    // 1. Drop 1 bottle
    const dropBtn = document.getElementById('btn-drop-bottle');
    if (dropBtn) {
      dropBtn.addEventListener('click', () => {
        this.callbacks.onDropBottle();
      });
    }

    // 2. Drop 1 garbage bag
    const dropBagBtn = document.getElementById('btn-drop-bag');
    if (dropBagBtn) {
      dropBagBtn.addEventListener('click', () => {
        if (this.callbacks.onDropBag) {
          this.callbacks.onDropBag();
        }
      });
    }

    // 3. Auto-fill toggle
    const autoBtn = document.getElementById('btn-auto-fill');
    const autoText = document.getElementById('auto-btn-text');
    const autoIcon = document.getElementById('auto-btn-icon');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        this.isAutoFillActive = !this.isAutoFillActive;
        this.updateAutoBtnUI(this.isAutoFillActive);
        this.callbacks.onToggleAutoFill(this.isAutoFillActive);
      });
    }

    // 4. Reset bin
    const resetBtn = document.getElementById('btn-reset-bin');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.callbacks.onResetBin();
      });
    }
  }

  updateAutoBtnUI(isActive) {
    const autoBtn = document.getElementById('btn-auto-fill');
    const autoText = document.getElementById('auto-btn-text');
    const autoIcon = document.getElementById('auto-btn-icon');
    if (!autoBtn) return;

    if (isActive) {
      autoBtn.classList.add('active');
      if (autoIcon) {
        autoIcon.innerHTML = `<svg class="btn-icon-svg" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
      }
      if (autoText) autoText.textContent = 'Dừng lại';
    } else {
      autoBtn.classList.remove('active');
      if (autoIcon) {
        autoIcon.innerHTML = `<svg class="btn-icon-svg" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
      }
      if (autoText) autoText.textContent = 'Tự động';
    }
  }

  setAutoFillState(isActive) {
    this.isAutoFillActive = isActive;
    this.updateAutoBtnUI(isActive);
  }
}
