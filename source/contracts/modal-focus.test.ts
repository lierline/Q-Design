import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activateModal, focusableWithin } from './modal-focus';
import { readSource } from '@/lib/test-utils/contract-source';

class ElementFixture {
  tabIndex = 0;
  disabled = false;
  hidden = false;
  inert = false;
  visibility = 'visible';
  connected = true;
  style = { zIndex: '' };
  children: ElementFixture[] = [];
  parent: ElementFixture | null = null;
  constructor(readonly name: string) {}
  get isConnected(): boolean { return this.connected && (this.parent?.isConnected ?? true); }
  append(...children: ElementFixture[]) { this.children.push(...children); children.forEach(child => { child.parent = this; }); return this; }
  querySelectorAll(): ElementFixture[] { return this.children.flatMap(child => [child, ...child.querySelectorAll()]); }
  getClientRects() { return this.hidden ? [] : [{ width: 44, height: 44 }]; }
  closest(): ElementFixture | null { return this.inert ? this : this.parent?.closest() ?? null; }
  matches() { return this.disabled; }
  contains(target: ElementFixture | null): boolean { return target === this || this.children.some(child => child.contains(target)); }
  focus() {
    doc.activeElement = this;
    const event = new Event('focusin');
    Object.defineProperty(event, 'target', { value: this });
    doc.dispatchEvent(event);
  }
}
class DocumentFixture extends EventTarget {
  activeElement: ElementFixture | null = null;
  body = { style: { overflow: 'scroll' } };
}
let doc: DocumentFixture;
let releases: Array<() => void>;
const html = (element: ElementFixture) => element as unknown as HTMLElement;
function mount(dialog: ElementFixture, onEscape = vi.fn(), initialFocus?: ElementFixture) {
  const release = activateModal(html(dialog), onEscape, { initialFocus: initialFocus ? html(initialFocus) : undefined });
  releases.push(release);
  return release;
}
function key(value: string, shiftKey = false) {
  const event = new Event('keydown', { cancelable: true });
  Object.defineProperties(event, { key: { value }, shiftKey: { value: shiftKey } });
  doc.dispatchEvent(event);
  return event;
}
beforeEach(() => {
  doc = new DocumentFixture();
  releases = [];
  vi.stubGlobal('document', doc);
  vi.stubGlobal('getComputedStyle', (element: ElementFixture) => ({ visibility: element.visibility, zIndex: element.style.zIndex || 'auto' }));
});
afterEach(() => {
  [...releases].reverse().forEach(release => release());
  vi.unstubAllGlobals();
});

describe('shared overlay ownership', () => {
  it('one Escape closes only the nested overlay, restoring its opener without releasing scroll', () => {
    const page = new ElementFixture('page opener');
    page.focus();
    const outerButton = new ElementFixture('outer opener');
    const outer = new ElementFixture('outer').append(outerButton);
    const outerEscape = vi.fn();
    const closeOuter = mount(outer, outerEscape);
    const innerButton = new ElementFixture('inner button');
    const inner = new ElementFixture('inner').append(innerButton);
    const innerEscape = vi.fn(() => closeInner());
    const closeInner = mount(inner, innerEscape);
    expect(doc.activeElement).toBe(innerButton);
    expect(key('Escape').defaultPrevented).toBe(true);
    expect(innerEscape).toHaveBeenCalledOnce();
    expect(outerEscape).not.toHaveBeenCalled();
    expect(doc.activeElement).toBe(outerButton);
    expect(doc.body.style.overflow).toBe('hidden');
    key('Escape');
    expect(outerEscape).toHaveBeenCalledOnce();
    closeOuter();
    expect(doc.body.style.overflow).toBe('scroll');
    expect(doc.activeElement).toBe(page);
  });

  it('closing the underlying overlay out of order preserves the top owner and restores a connected ancestor opener', () => {
    const page = new ElementFixture('page opener');
    page.focus();
    const outer = new ElementFixture('outer').append(new ElementFixture('outer button'));
    const closeOuter = mount(outer);
    const innerButton = new ElementFixture('inner button');
    const closeInner = mount(new ElementFixture('inner').append(innerButton));
    closeOuter();
    outer.connected = false;
    expect(doc.activeElement).toBe(innerButton);
    expect(doc.body.style.overflow).toBe('hidden');
    closeInner();
    closeInner();
    expect(doc.body.style.overflow).toBe('scroll');
    expect(doc.activeElement).toBe(page);
  });

  it('Tab wraps through visible enabled controls and excludes hidden and inert descendants', () => {
    const first = new ElementFixture('first');
    const last = new ElementFixture('last');
    const hidden = new ElementFixture('hidden'); hidden.hidden = true;
    const disabled = new ElementFixture('disabled'); disabled.disabled = true;
    const invisible = new ElementFixture('invisible'); invisible.visibility = 'hidden';
    const inert = new ElementFixture('inert section').append(new ElementFixture('inert button')); inert.inert = true;
    const negative = new ElementFixture('programmatic only'); negative.tabIndex = -1;
    const dialog = new ElementFixture('dialog').append(hidden, disabled, invisible, inert, negative, first, last);
    expect(focusableWithin(html(dialog))).toEqual([first, last]);
    mount(dialog);
    expect(doc.activeElement).toBe(first);
    key('Tab', true);
    expect(doc.activeElement).toBe(last);
    key('Tab');
    expect(doc.activeElement).toBe(first);
    new ElementFixture('outside').focus();
    expect(doc.activeElement).toBe(first);
  });

  it('an overlay without a visible control remains a valid focus target', () => {
    const hidden = new ElementFixture('hidden'); hidden.hidden = true;
    const dialog = new ElementFixture('dialog').append(hidden);
    mount(dialog);
    expect(doc.activeElement).toBe(dialog);
    expect(key('Tab').defaultPrevented).toBe(true);
    expect(doc.activeElement).toBe(dialog);
  });

  it('confirmation starts on cancel and never intercepts Enter to approve', () => {
    const approve = new ElementFixture('approve');
    const cancel = new ElementFixture('cancel');
    const escape = vi.fn();
    mount(new ElementFixture('confirmation').append(approve, cancel), escape, cancel);
    expect(doc.activeElement).toBe(cancel);
    expect(key('Enter').defaultPrevented).toBe(false);
    expect(escape).not.toHaveBeenCalled();
  });

  it('nested layers rise above their parent while retaining live canonical z-index variables', () => {
    const outer = new ElementFixture('modal'); outer.style.zIndex = 'var(--qd-z-modal, 1100)';
    const inner = new ElementFixture('drawer'); inner.style.zIndex = 'var(--qd-z-overlay, 1000)';
    mount(outer);
    const closeInner = mount(inner);
    expect(inner.style.zIndex).toBe('max(var(--qd-z-overlay, 1000), calc(var(--qd-z-modal, 1100) + 1))');
    closeInner();
    expect(inner.style.zIndex).toBe('var(--qd-z-overlay, 1000)');
  });

  it('Modal, Drawer and Confirm all use the shared owner instead of independent key listeners', () => {
    const core = readSource('lib/design/components.tsx');
    for (const name of ['Modal', 'Drawer']) {
      const start = core.indexOf(`export function ${name}(`);
      const end = core.indexOf('  if (!open || !mounted) return null;', start);
      const body = core.slice(start, end);
      expect(body).toContain('useModalFocus(open && mounted, panelRef, onClose');
      expect(body).not.toContain("addEventListener('keydown'");
    }
    const confirmation = readSource('components/Confirm.tsx');
    expect(confirmation).toContain('useModalFocus(true, dialogRef');
    expect(confirmation).toContain('initialFocusRef: opts.hideCancel ? confirmBtnRef : cancelBtnRef');
    expect(confirmation).not.toContain("addEventListener('keydown'");
  });
});
