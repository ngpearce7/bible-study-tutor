import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";

type Slot = { node: any; props: TextInputProps };
type Entry = { focusRequest: number; index: number; props: TextInputProps; left: number; top: number; width: number; height: number };
type Controller = {
  register: (index: number, slot: Slot) => void;
  unregister: (index: number) => void;
  focus: (index: number) => void;
  refresh: (index: number) => void;
  isFocused: (index: number) => boolean;
};
const ActiveSlotContext = createContext<number | null>(null);
const StableInputContext = createContext<Controller | null>(null);

// One DOM input remains focused for the whole verse. Changing DOM focus between
// dozens of blanks lets mobile browsers pan the page independently of our scroller.
export function StableMemoryInput({ children, style }: { children: React.ReactNode; style: ViewStyle | any[] }) {
  const container = useRef<any>(null);
  const input = useRef<any>(null);
  const slots = useRef(new Map<number, Slot>());
  const active = useRef<number | null>(null);
  const focusRequest = useRef(0);
  const [entry, setEntry] = useState<Entry | null>(null);
  const controller = useMemo<Controller>(() => {
    const update = (index: number) => {
      const slot = slots.current.get(index);
      const parent = container.current;
      if (!slot?.node || !parent) return;
      const rect = slot.node.getBoundingClientRect();
      const bounds = parent.getBoundingClientRect();
      setEntry({ focusRequest: focusRequest.current, index, props: slot.props, left: rect.left - bounds.left, top: rect.top - bounds.top, width: rect.width, height: rect.height });
    };
    return {
      register(index, slot) { slots.current.set(index, slot); if (active.current === index) update(index); },
      unregister(index) { slots.current.delete(index); },
      focus(index) { active.current = index; focusRequest.current += 1; update(index); },
      refresh: update,
      isFocused(index) { return active.current === index && !!input.current?.isFocused?.(); },
    };
  }, []);
  useLayoutEffect(() => {
    if (!entry || !input.current || input.current.isFocused?.()) return;
    input.current.focus({ preventScroll: true });
  }, [entry?.focusRequest]);
  return (
    <StableInputContext.Provider value={controller}>
    <ActiveSlotContext.Provider value={entry?.index ?? null}>
      <View ref={container} style={style} onLayout={() => {
        if (active.current !== null) controller.refresh(active.current);
      }}>
        {children}
        {entry && <TextInput
          {...entry.props}
          ref={input}
          autoFocus={false}
          autoCorrect={false}
          spellCheck={false}
          autoComplete="off"
          keyboardType="default"
          style={[entry.props.style, { position: "absolute", left: entry.left, top: entry.top, width: entry.width, height: entry.height }]}
        />}
      </View>
    </ActiveSlotContext.Provider>
    </StableInputContext.Provider>
  );
}

// The layout slot stays in the wrapping verse. Its public ref measures that slot
// but focuses the shared input, so the existing next-word and reveal logic works.
export function StableMemoryInputSlot({ index, inputProps, inputRef }: {
  index: number;
  inputProps: TextInputProps;
  inputRef?: (input: any) => void;
}) {
  const controller = useContext(StableInputContext);
  const activeIndex = useContext(ActiveSlotContext);
  const node = useRef<any>(null);
  useLayoutEffect(() => {
    if (!controller) return;
    controller.register(index, { node: node.current, props: inputProps });
    inputRef?.({
      focus: () => controller.focus(index),
      isFocused: () => controller.isFocused(index),
      measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => {
        const rect = node.current?.getBoundingClientRect();
        if (rect) callback(rect.left, rect.top, rect.width, rect.height);
      }
    });
    return () => { inputRef?.(null); controller.unregister(index); };
  }, [controller, index, inputProps, inputRef]);
  if (!controller) return <TextInput {...inputProps} ref={inputRef} />;
  return <Pressable
    ref={node}
    accessibilityRole="button"
    accessibilityLabel={`Word ${index + 1}: ${inputProps.value || "blank"}`}
    onPress={() => controller.focus(index)}
    onLayout={() => controller.register(index, { node: node.current, props: inputProps })}
    style={inputProps.style as any}
  ><Text style={{ opacity: activeIndex === index ? 0 : 1, color: "inherit" as any, fontSize: 16, fontWeight: "800", lineHeight: 25, textAlign: "center" }}>{inputProps.value || "\u00a0"}</Text></Pressable>;
}
