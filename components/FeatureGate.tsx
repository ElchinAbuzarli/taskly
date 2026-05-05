'use client';

import type { ReactNode } from 'react';

type FeatureState = { enabled: boolean; limitValue: number | null } | undefined;

type FeatureGateProps = {
  featureCode: string;
  features: Record<string, { enabled: boolean; limitValue: number | null }> | null;
  children: ReactNode;
  fallback?: ReactNode;
};

export default function FeatureGate({ featureCode, features, children, fallback }: FeatureGateProps) {
  const feature: FeatureState = features?.[featureCode];

  if (feature?.enabled) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: '#2a1f27', color: '#f0b6ca' }}>
      Bu ozellik planiniza daxil deyil: <span style={{ fontFamily: 'ui-monospace, monospace' }}>{featureCode}</span>
    </div>
  );
}
