'use client';

import { useEffect, useRef, type RefObject } from 'react';

type ModalEntry = { dialog: HTMLElement; layer: HTMLElement; restoreTargets: HTMLElement[]; focusInitial: () => void };
const openModals: ModalEntry[] = [];
let originalOverflow = '';
const focusableSelector = 'button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

function visible(element: HTMLElement): boolean {
  return element.isConnected && !element.closest('[inert]') && element.getClientRects().length > 0
    && getComputedStyle(element).visibility !== 'hidden';
}

export function focusableWithin(dialog: HTMLElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
    .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && visible(element));
}

/** Only the top overlay handles keys. Scroll remains locked until the last overlay leaves. */
export function activateModal(dialog: HTMLElement, onEscape: () => void, options: { layer?: HTMLElement | null; initialFocus?: HTMLElement | null } = {}): () => void {
  const previous = document.activeElement as HTMLElement | null;
  const layer = options.layer ?? dialog;
  const originalZ = layer.style.zIndex;
  const underlying = openModals.at(-1);
  const restoreTargets = [...new Set([previous, ...openModals.flatMap(entry => entry.restoreTargets)].filter((element): element is HTMLElement => !!element && typeof element.focus === 'function'))];
  const entry: ModalEntry = { dialog, layer, restoreTargets, focusInitial: () => undefined };
  const ownsFocus = () => openModals.at(-1) === entry;
  entry.focusInitial = () => {
    const available = focusableWithin(dialog);
    const requested = options.initialFocus;
    const initial = requested && available.includes(requested) ? requested : available[0] ?? dialog;
    initial.focus({ preventScroll: true });
  };
  if (!openModals.length) originalOverflow = document.body.style.overflow;
  // A drawer opened from a modal must also sit above it visually. Keep both live CSS variables.
  if (underlying) {
    const base = originalZ || getComputedStyle(layer).zIndex || '0';
    const below = underlying.layer.style.zIndex || getComputedStyle(underlying.layer).zIndex || '0';
    layer.style.zIndex = `max(${base === 'auto' ? '0' : base}, calc(${below === 'auto' ? '0' : below} + 1))`;
  }
  openModals.push(entry);
  document.body.style.overflow = 'hidden';

  const onKey = (event: KeyboardEvent) => {
    if (!ownsFocus()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      onEscape();
      return;
    }
    if (event.key !== 'Tab') return;
    const available = focusableWithin(dialog);
    const first = available[0];
    const last = available.at(-1);
    const active = document.activeElement as HTMLElement | null;
    if (!first || !last) { event.preventDefault(); dialog.focus({ preventScroll: true }); return; }
    if (!available.includes(active!)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus({ preventScroll: true });
    } else if (event.shiftKey && active === first) {
      event.preventDefault(); last.focus({ preventScroll: true });
    } else if (!event.shiftKey && active === last) {
      event.preventDefault(); first.focus({ preventScroll: true });
    }
  };
  const onFocus = (event: FocusEvent) => {
    if (ownsFocus() && !dialog.contains(event.target as Node | null)) entry.focusInitial();
  };
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('focusin', onFocus);
  entry.focusInitial();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    const wasTop = ownsFocus();
    const index = openModals.indexOf(entry);
    if (index !== -1) openModals.splice(index, 1);
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('focusin', onFocus);
    layer.style.zIndex = originalZ;
    if (!openModals.length) document.body.style.overflow = originalOverflow;
    if (!wasTop) return;
    const next = openModals.at(-1);
    const target = restoreTargets.find(element => visible(element) && !element.matches(':disabled') && (!next || next.dialog.contains(element)));
    if (target) target.focus({ preventScroll: true });
    else next?.focusInitial();
  };
}

/** Callback changes must not release/reacquire focus while the user edits an open form. */
export function useModalFocus(open: boolean, dialogRef: RefObject<HTMLElement | null>, onEscape: () => void, options: { layerRef?: RefObject<HTMLElement | null>; initialFocusRef?: RefObject<HTMLElement | null> } = {}): void {
  const onEscapeRef = useRef(onEscape);
  useEffect(() => { onEscapeRef.current = onEscape; }, [onEscape]);
  const { layerRef, initialFocusRef } = options;
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    return activateModal(dialogRef.current, () => onEscapeRef.current(), { layer: layerRef?.current, initialFocus: initialFocusRef?.current });
  }, [open, dialogRef, layerRef, initialFocusRef]);
}
