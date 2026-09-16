import { useEffect, useState } from "react";
import { Platform, type ViewStyle } from "react-native";

// Safari's keyboard changes the visual viewport independently of the layout
// viewport. Keep the practice scroll container inside the actually visible area.
export function usePracticeViewport(enabled: boolean): ViewStyle | undefined {
  const [bounds, setBounds] = useState<{ height: number; top: number }>();
  useEffect(() => {
    if (Platform.OS !== "web" || !enabled || !window.visualViewport) return;
    const viewport = window.visualViewport;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (viewport.scale !== 1) { setBounds(undefined); return; }
        setBounds({ height: viewport.height, top: viewport.offsetTop });
      });
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [enabled]);
  return enabled && bounds ? { position: "fixed", left: 0, right: 0, top: bounds.top, height: bounds.height, flex: 0 } as unknown as ViewStyle : undefined;
}
