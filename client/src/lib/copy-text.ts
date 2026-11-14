/**
 * Copies text to the clipboard and reports whether it worked.
 *
 * Synchronous first, on purpose: "Copy brief and message me" copies and
 * then opens LinkedIn in a new tab from the same click. The async Clipboard
 * API can still be pending when the new tab takes focus, and browsers
 * reject writes from an unfocused page, so the copy would silently fail.
 * A selected textarea and execCommand('copy') finish before the click
 * returns. The async API is the fallback for browsers that refuse that.
 */
export async function copyText(text: string): Promise<boolean> {
  if (copySync(text)) return true;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function copySync(text: string): boolean {
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.setAttribute('aria-hidden', 'true');
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
  document.body.appendChild(area);
  area.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  area.remove();
  active?.focus({ preventScroll: true });
  return copied;
}
