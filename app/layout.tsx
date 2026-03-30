import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'الذئب الابيض | White Wolf',
  description: 'منصة إدارة البوتات الاحترافية',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-50 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
