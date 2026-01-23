/**
 * Downloads a file from a URL, using browser-specific workarounds when needed.
 *
 * Firefox has a known limitation (Bug 453455) where PDFs open in new tabs
 * despite download attribute. This function uses a hidden iframe workaround
 * for PDFs in Firefox-based browsers.
 *
 * @param url - The blob URL or HTTP URL to download
 * @param filename - Suggested filename for the download
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const isFirefoxBased = /Firefox|Seamonkey|Zen/i.test(navigator.userAgent);
  const isPDF = filename.toLowerCase().endsWith('.pdf');
  const needsIframeWorkaround = isFirefoxBased && isPDF;

  if (needsIframeWorkaround) {
    downloadViaIframe(url);
  } else {
    downloadViaAnchor(url, filename);
  }
}

function downloadViaIframe(url: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.src = url;

  document.body.appendChild(iframe);

  // Cleanup after download initiates (1500ms per research)
  setTimeout(() => {
    document.body.removeChild(iframe);
    URL.revokeObjectURL(url);
  }, 1500);
}

function downloadViaAnchor(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Shorter cleanup for anchor (100ms)
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
