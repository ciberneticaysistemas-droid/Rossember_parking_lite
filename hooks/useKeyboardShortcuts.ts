import { useEffect } from 'react';

type ShortcutMap = Record<string, () => void>;

/**
 * Hook that listens for keyboard shortcuts globally.
 * It is SAFE: shortcuts are ignored when the focus is inside
 * an INPUT, TEXTAREA, or SELECT (e.g., while typing a plate).
 *
 * @param shortcuts - An object mapping key names (e.g. 'F2', 'F3') to callback functions.
 * @param enabled - Whether the listener is active. Defaults to true.
 */
export const useKeyboardShortcuts = (shortcuts: ShortcutMap, enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Safety check: never fire when the user is typing in a field
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isTyping) return;

      const key = e.key; // e.g. 'F2', 'F3', 'Enter'
      const action = shortcuts[key];

      if (action) {
        e.preventDefault(); // Prevent F-keys from triggering browser actions (e.g. F1 = Help)
        action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
};
