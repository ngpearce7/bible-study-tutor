import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Keyboard, Platform } from "react-native";

export function useAutoHideNavigation(screen: string) {
  const [scrollHidden, setScrollHidden] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const scroll = useRef({ last: 0, travel: 0 });
  useEffect(() => {
    scroll.current = { last: 0, travel: 0 };
    setScrollHidden(false);
  }, [screen]);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduceMotion(value); }).catch(() => undefined);
    const motion = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardOpen(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => { setKeyboardOpen(false); setScrollHidden(false); });
    // Mobile browsers do not emit React Native keyboard events. Hide while editing,
    // including rich-text editors, without relying on unreliable keyboard heights.
    let frame = 0;
    const checkFocus = () => {
      const active = document.activeElement;
      const editing = active instanceof HTMLElement && (active.isContentEditable ||
        (active instanceof HTMLTextAreaElement && !active.readOnly) ||
        (active instanceof HTMLInputElement && !active.readOnly && !["button", "checkbox", "radio", "submit", "range"].includes(active.type)));
      setKeyboardOpen(editing);
      if (!editing) setScrollHidden(false);
    };
    const onBlur = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(checkFocus); };
    if (Platform.OS === "web") {
      document.addEventListener("focusin", checkFocus);
      document.addEventListener("focusout", onBlur);
    }
    return () => {
      mounted = false; motion.remove(); show.remove(); hide.remove();
      if (Platform.OS === "web") {
        document.removeEventListener("focusin", checkFocus);
        document.removeEventListener("focusout", onBlur);
        cancelAnimationFrame(frame);
      }
    };
  }, []);
  function onScroll(y: number, maximum: number) {
    const next = Math.max(0, Math.min(y, Math.max(0, maximum)));
    const delta = next - scroll.current.last;
    scroll.current.last = next;
    if (next <= 8) { scroll.current.travel = 0; setScrollHidden(false); return; }
    if (!delta) return;
    scroll.current.travel = Math.sign(delta) === Math.sign(scroll.current.travel) ? scroll.current.travel + delta : delta;
    if (Math.abs(scroll.current.travel) >= 16) {
      setScrollHidden(scroll.current.travel > 0);
      scroll.current.travel = 0;
    }
  }
  return { hidden: scrollHidden || keyboardOpen, reduceMotion, onScroll };
}
