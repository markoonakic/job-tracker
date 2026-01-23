/**
 * Downloads a file from a URL, using browser-specific workarounds when needed.
 *
 * Firefox has a known limitation (Bug 453455) where PDFs open in new tabs
 * despite download attribute. This function uses a hidden iframe workaround
 * for PDFs in Firefox-based browsers.
 *
 * @param originalUrl - The original HTTP URL (with Content-Disposition header)
 * @param blobUrl - The blob URL for anchor downloads
 * @param filename - Suggested filename for the download
 * @param blob - The original blob
 */
export async function downloadFile(
  originalUrl: string,
  blobUrl: string,
  filename: string,
  blob: Blob
): Promise<void> {
  const isFirefoxBased = /Firefox|Seamonkey|Zen/i.test(navigator.userAgent);
  const isPDF = filename.toLowerCase().endsWith('.pdf');
  const needsIframeWorkaround = isFirefoxBased && isPDF;

  console.log('=== downloadFile DEBUG ===');
  console.log('User Agent:', navigator.userAgent);
  console.log('Filename:', filename);
  console.log('Original blob type:', blob.type);
  console.log('isFirefoxBased:', isFirefoxBased);
  console.log('isPDF:', isPDF);
  console.log('needsIframeWorkaround:', needsIframeWorkaround);
  console.log('Method:', needsIframeWorkaround ? 'iframe with original URL' : 'anchor with blob URL');

  if (needsIframeWorkaround) {
    // Use original URL with Content-Disposition header for proper filename
    console.log('Using original URL in iframe:', originalUrl);
    downloadViaIframe(originalUrl);

    // Clean up blob URL since we're not using it
    URL.revokeObjectURL(blobUrl);
  } else {
    downloadViaAnchor(blobUrl, filename);
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
