import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'ApproveGate Inbox - Inbox-to-Action Butler',
  description:
    'Messy inbox and support-ticket triage with draft replies and a hard human-approve gate. Zero auto-send guarantee.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F7F8FA] text-slate-900 h-screen flex flex-col font-sans antialiased overflow-hidden">
        <Navbar />
        <main className="flex-1 flex flex-col overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
