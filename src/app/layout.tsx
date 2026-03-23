import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Conceptra — Research papers, finally understood',
  description:
    'Upload any research paper. Get 5-8 key concepts, each with an XAI visual diagram, plain-English explanation, short animated clip, structured notes, and a quiz — all in under 60 seconds.',
  openGraph: {
    title: 'Conceptra',
    description: 'Research papers, finally understood.',
    url: 'https://conceptra.ai',
    siteName: 'Conceptra',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conceptra',
    description: 'Upload any research paper. Get concepts, visuals and quizzes in 60 seconds.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
