import { UploadForm } from '@/components/UploadForm';
import Link from 'next/link';

export const metadata = {
  title: 'Upload Paper — Conceptra',
  description: 'Upload a PDF, paste an arXiv URL, or enter a DOI to extract concepts.',
};

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-100 px-6 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-slate-800">Conceptra</span>
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
            Upload a research paper
          </h1>
          <p className="text-slate-500">
            Get 5–8 concepts with XAI diagrams, clips, notes and quizzes in under 60 seconds.
          </p>
        </div>

        <UploadForm />
      </div>
    </div>
  );
}
