'use client';

import { QRPreviewCard } from './qr-preview-card';
import { QRHowItWorksCard, QRTipsCard } from './qr-info-cards';

interface OrgQRDisplayProps {
  organizationId: number;
  organizationName: string;
  logoUrl?: string | null;
}

export function OrgQRDisplay({ organizationId, organizationName, logoUrl }: OrgQRDisplayProps) {
  const qrData = JSON.stringify({
    type: 'organization',
    id: organizationId,
    name: organizationName,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <QRPreviewCard qrData={qrData} organizationName={organizationName} logoUrl={logoUrl} />

      <div className="flex flex-col gap-4">
        <QRHowItWorksCard />
        <QRTipsCard />
      </div>
    </div>
  );
}
