// Opens a link after a tap animation has had a moment to play. A delayed window.open can be
// blocked as a popup, so fall back to navigating the current tab.
export function openAfter(url: string, delay: number) {
  window.setTimeout(() => {
    const win = window.open(url, "_blank");
    if (win) win.opener = null;
    else window.location.href = url;
  }, delay);
}
