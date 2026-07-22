import { useState, useEffect, useCallback } from "react";

/**
 * useModal — controls open/close state for Modals/Drawers with ESC + body-lock.
 *   const { isOpen, open, close, toggle } = useModal();
 */
export function useModal(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return { isOpen, open, close, toggle };
}

/**
 * useClipboard — copy text to clipboard with a transient "copied" flag.
 *   const { copied, copy } = useClipboard();
 */
export function useClipboard(timeout = 1500) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(
    async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
      } catch {
        setCopied(false);
      }
    },
    [timeout]
  );
  return { copied, copy };
}

/**
 * useDisclosure — generic open/close used by Dropdown, Tooltip, Accordion, etc.
 */
export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  return { isOpen, open, close, toggle };
}

/**
 * useOnClickOutside — calls handler when a click lands outside `ref`.
 */
export function useOnClickOutside(ref, handler) {
  useEffect(() => {
    if (!ref.current) return;
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}
