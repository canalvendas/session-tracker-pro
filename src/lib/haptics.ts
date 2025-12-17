/**
 * Haptic feedback utility for mobile devices
 * Uses the Navigator Vibrate API
 */

export const haptics = {
  /** Light tap feedback - 10ms */
  light: () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  },
  
  /** Medium tap feedback - 25ms */
  medium: () => {
    if (navigator.vibrate) {
      navigator.vibrate(25);
    }
  },
  
  /** Heavy tap feedback - 50ms */
  heavy: () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  },
  
  /** Success feedback - double pulse */
  success: () => {
    if (navigator.vibrate) {
      navigator.vibrate([15, 50, 15]);
    }
  },
  
  /** Error feedback - triple short pulse */
  error: () => {
    if (navigator.vibrate) {
      navigator.vibrate([30, 30, 30, 30, 30]);
    }
  },
};
