'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Link2, Hash, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type InputMode = 'pdf' | 'arxiv' | 'doi';

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

const INITIAL_STEPS: ProcessingStep[] = [
  { id: 'parse', label: 'Parsing paper…', status: 'pending' },
  { id: 'concepts', label: 'Extracting key concepts…', status: 'pending' },
  { id: 'visuals', label: 'Generating XAI diagrams…', status: 'pending' },
  { id: 'done', label: 'Building clips & quiz…', status: 'pending' },
];

export function UploadForm({ userId }: { userId?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [arxivUrl, setArxivUrl] = useState('');
  const [doi, setDoi] = useState('');

  const [processing, setProcessing] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>(INITIAL_STEPS);
  const [error, setError] = useState('');


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: useCallback((accepted: File[]) => {
      if (accepted[0]) setFile(accepted[0]);
    }, []),
  });

  function updateStep(id: string, status: ProcessingStep['status'], label?: string) {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, ...(label ? { label } : {}) } : s))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setProcessing(true);
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: 'pending' as const })));

    const formData = new FormData();
    if (mode === 'pdf' && file) formData.append('file', file);
    else if (mode === 'arxiv') formData.append('arxivUrl', arxivUrl);
    else if (mode === 'doi') formData.append('doi', doi);
    if (userId) formData.append('userId', userId);

    try {
      const res = await fetch('/api/process-paper', { method: 'POST', body: formData });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        // Use index-based loop so we can safely peek at lines[i+1]
        // without hitting indexOf's first-match bug on duplicate event names.
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith('event: ')) {
            const event = line.slice(7).trim();
            const dataLine = lines[i + 1];
            if (dataLine?.startsWith('data: ')) {
              try {
                const data = JSON.parse(dataLine.slice(6));
                handleSSEEvent(event, data);
              } catch { /* ignore malformed JSON */ }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed. Please try again.');
      setProcessing(false);
    }
  }

  function handleSSEEvent(event: string, data: Record<string, unknown>) {
    switch (event) {
      case 'step':
        updateStep(data.id as string, data.status as ProcessingStep['status'], data.label as string);
        break;
      case 'error':
        setError(data.message as string);
        setProcessing(false);
        break;
      case 'complete':
        setProcessing(false);
        router.push(`/paper/${data.paperId}`);
        break;
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {!processing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mode tabs */}
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {[
              { id: 'pdf', label: '📄 Upload PDF', icon: Upload },
              { id: 'arxiv', label: '🔗 arXiv URL', icon: Link2 },
              { id: 'doi', label: '#️⃣ DOI', icon: Hash },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id as InputMode)}
                className={cn(
                  'flex-1 py-2.5 px-3 text-sm font-medium rounded-lg transition-all',
                  mode === m.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Input area */}
          {mode === 'pdf' && (
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50',
                file && 'border-teal-400 bg-teal-50'
              )}
            >
              <input {...getInputProps()} />
              {file ? (
                <div>
                  <div className="text-4xl mb-2">📄</div>
                  <p className="font-medium text-teal-700">{file.name}</p>
                  <p className="text-sm text-teal-600 mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB · Click to change</p>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto mb-3 text-slate-400" size={32} />
                  <p className="font-medium text-slate-700">Drop your PDF here</p>
                  <p className="text-sm text-slate-500 mt-1">or click to browse · Up to 50MB, 50 pages</p>
                </div>
              )}
            </div>
          )}

          {mode === 'arxiv' && (
            <input
              type="url"
              placeholder="https://arxiv.org/abs/2307.09288"
              value={arxivUrl}
              onChange={(e) => setArxivUrl(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          )}

          {mode === 'doi' && (
            <input
              type="text"
              placeholder="10.1038/s41586-021-03819-2"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          )}


          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={mode === 'pdf' && !file}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-indigo-200"
          >
            Process paper <ArrowRight size={18} />
          </button>

          <p className="text-center text-xs text-slate-400">
            Usually ready in 45–60 seconds · 3 papers free, no sign-up needed
          </p>
        </form>
      ) : (
        <div className="text-center space-y-8">
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
              <Loader2 className="text-indigo-600 animate-spin" size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Processing your paper…</h2>
            <p className="text-sm text-slate-500 mt-1">Usually ready in 45–60 seconds</p>
          </div>

          <div className="max-w-sm mx-auto space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl transition-all duration-300',
                  step.status === 'active' && 'bg-indigo-100 border-l-4 border-indigo-500 shadow-sm scale-[1.02]',
                  step.status === 'done' && 'bg-teal-50 border-l-4 border-teal-400',
                  step.status === 'pending' && 'opacity-35 border-l-4 border-transparent',
                )}
              >
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                  step.status === 'done' && 'bg-teal-500 text-white',
                  step.status === 'active' && 'bg-indigo-600 text-white ring-4 ring-indigo-200 animate-pulse',
                  step.status === 'pending' && 'bg-slate-200 text-slate-400',
                )}>
                  {step.status === 'done' ? '✓' : step.status === 'active' ? <Loader2 size={14} className="animate-spin" /> : '·'}
                </div>
                <span className={cn(
                  'text-sm',
                  step.status === 'active' && 'text-indigo-800 font-semibold',
                  step.status === 'done' && 'text-teal-700 font-medium',
                  step.status === 'pending' && 'text-slate-400 font-medium',
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
