import type { RefObject } from 'react';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function generateQRBlob(
  qrContainerRef: RefObject<HTMLDivElement | null>,
  t: (key: string) => string,
  organizationName: string,
  logoUrl?: string | null,
): Promise<Blob | null> {
  const svgEl = qrContainerRef.current?.querySelector('svg');
  if (!svgEl) return null;

  const canvasWidth = 600;
  const padding = 48;
  const logoTitleHeight = 50;
  const gapAfterLogo = 24;
  const qrSize = 360;
  const gapAfterQR = 24;
  const orgSectionHeight = logoUrl ? 60 : 36;
  const gapAfterOrg = 16;
  const taglineHeight = 40;
  const gapAfterTagline = 12;
  const footerHeight = 16;
  const canvasHeight =
    padding + logoTitleHeight + gapAfterLogo + qrSize + gapAfterQR +
    orgSectionHeight + gapAfterOrg + taglineHeight + gapAfterTagline +
    footerHeight + padding;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  let cursorY = padding;

  // 1. LogoTitle on top
  try {
    const logoTitleImg = await loadImage('/images/logos/LogoTitle.png');
    const logoTitleAspect = logoTitleImg.width / logoTitleImg.height;
    const logoTitleDrawWidth = Math.min(logoTitleHeight * logoTitleAspect, canvasWidth - padding * 2);
    const logoTitleDrawHeight = logoTitleDrawWidth / logoTitleAspect;
    ctx.drawImage(
      logoTitleImg,
      (canvasWidth - logoTitleDrawWidth) / 2,
      cursorY,
      logoTitleDrawWidth,
      logoTitleDrawHeight,
    );
  } catch {
    // skip if unavailable
  }
  cursorY += logoTitleHeight + gapAfterLogo;

  // 2. QR code with blue border
  const framePadding = 20;
  const frameBorder = 4;
  const frameSize = qrSize + framePadding * 2 + frameBorder * 2;
  const frameX = (canvasWidth - frameSize) / 2;
  const frameY = cursorY - framePadding - frameBorder;

  const radius = 16;
  ctx.strokeStyle = '#31A1D6';
  ctx.lineWidth = frameBorder;
  ctx.beginPath();
  ctx.roundRect(frameX, frameY, frameSize, frameSize, radius);
  ctx.stroke();

  const svgData = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  const qrImg = await loadImage(svgUrl);
  URL.revokeObjectURL(svgUrl);
  ctx.drawImage(qrImg, (canvasWidth - qrSize) / 2, cursorY, qrSize, qrSize);
  cursorY += qrSize + framePadding + frameBorder + gapAfterQR;

  // 3. Org logo or org name
  ctx.textAlign = 'center';
  if (logoUrl) {
    try {
      const orgLogoImg = await loadImage(logoUrl);
      const orgLogoHeight = 56;
      const orgLogoAspect = orgLogoImg.width / orgLogoImg.height;
      const orgLogoDrawWidth = orgLogoHeight * orgLogoAspect;
      ctx.drawImage(
        orgLogoImg,
        (canvasWidth - orgLogoDrawWidth) / 2,
        cursorY,
        orgLogoDrawWidth,
        orgLogoHeight,
      );
      cursorY += orgSectionHeight + gapAfterOrg;
    } catch {
      ctx.fillStyle = '#1A1A2E';
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
      ctx.fillText(organizationName, canvasWidth / 2, cursorY + 28);
      cursorY += orgSectionHeight + gapAfterOrg;
    }
  } else {
    ctx.fillStyle = '#1A1A2E';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(organizationName, canvasWidth / 2, cursorY + 28);
    cursorY += orgSectionHeight + gapAfterOrg;
  }

  // 4. Tagline
  ctx.fillStyle = '#6b7280';
  ctx.font = '15px system-ui, -apple-system, sans-serif';
  const tagline = t('printTagline');
  const words = tagline.split(' ');
  const maxLineWidth = canvasWidth - padding * 2;
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxLineWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  for (const line of lines) {
    ctx.fillText(line, canvasWidth / 2, cursorY);
    cursorY += 20;
  }
  cursorY += gapAfterTagline;

  // 5. Footer
  ctx.fillStyle = '#9ca3af';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText(t('printFooter'), canvasWidth / 2, cursorY);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}
