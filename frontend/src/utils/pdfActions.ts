import type { Campaign } from '../data/mockData';

export function orderSheetFilename(campaign: Campaign) {
  const ref = (campaign.dabRef || campaign.id || 'order-sheet').replace(/[^A-Za-z0-9_.-]+/g, '_');
  return ensurePdfFilename(`${ref}_Order_Sheet.pdf`);
}

export function downloadBlob(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = ensurePdfFilename(filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

function ensurePdfFilename(filename: string) {
  const safeFilename = (filename || 'order-sheet').replace(/[^A-Za-z0-9_.-]+/g, '_');
  return safeFilename.toLowerCase().endsWith('.pdf') ? safeFilename : `${safeFilename}.pdf`;
}

export function printBlob(blob: Blob, fallbackUrl?: string, targetWindow?: Window | null) {
  const blobUrl = URL.createObjectURL(blob);
  const printWindow = targetWindow || window.open(blobUrl, '_blank', 'noopener,noreferrer');

  if (!printWindow) {
    if (fallbackUrl) {
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
    URL.revokeObjectURL(blobUrl);
    return;
  }

  if (targetWindow) {
    printWindow.location.href = blobUrl;
  }

  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    URL.revokeObjectURL(blobUrl);
  }, 700);
}

export async function shareOrderSheet(campaign: Campaign) {
  const url = campaign.orderSheetPdfUrl || window.location.href;
  const shareData = {
    title: `KBC Digital AdBoard Order Sheet - ${campaign.dabRef}`,
    text: `Please review the order sheet for campaign: ${campaign.name}`,
    url,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.error('Error sharing:', err);
    }
  }

  const email = prompt('Enter email address to share the Order Sheet PDF with:', campaign.clientEmail);
  if (email) {
    const subject = encodeURIComponent(`KBC Digital AdBoard Order Sheet - ${campaign.dabRef}`);
    const body = encodeURIComponent(`Hi,\n\nPlease find the Order Sheet for the campaign "${campaign.name}" here: ${url}\n\nBest regards.`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }
}
