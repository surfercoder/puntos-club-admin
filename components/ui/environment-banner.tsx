'use client';

import { useState } from 'react';

import { getEnvironmentInfo } from '@/lib/utils/environment-check';

export function EnvironmentBanner() {
  const [envInfo] = useState(() => getEnvironmentInfo());

  if (envInfo.environment === 'TEST') {
    return null; // Don't show banner for test environment
  }

  if (envInfo.isProduction) {
    return (
      <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-medium">
        ⚠️ WARNING: Connected to PRODUCTION database ({envInfo.projectId})
      </div>
    );
  }

  return (
    <div className="bg-yellow-500 text-black px-4 py-2 text-center text-sm font-medium">
      ❓ Unknown environment: {envInfo.projectId}
    </div>
  );
}
