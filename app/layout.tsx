import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Taskly',
  description: 'Dynamic pricing and feature entitlements',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
