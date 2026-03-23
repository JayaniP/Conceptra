import Link from 'next/link';
import { ArrowRight, Zap, Eye, Brain, Share2 } from 'lucide-react';

// Pre-generated sample concept cards for the landing page demo
const SAMPLE_CONCEPTS = [
  {
    name: 'Multi-Head Attention',
    paper: 'Attention Is All You Need',
    oneLine: 'Parallel attention over different representation subspaces',
    visual: `<svg viewBox="0 0 680 200" xmlns="http://www.w3.org/2000/svg" font-family="Inter,sans-serif">
      <rect width="680" height="200" fill="#0f172a"/>
      <!-- Input -->
      <rect x="20" y="70" width="80" height="60" rx="10" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>
      <text x="60" y="95" fill="#f59e0b" font-size="10" text-anchor="middle" font-weight="600">Query</text>
      <text x="60" y="108" fill="#94a3b8" font-size="9" text-anchor="middle">Q</text>
      <rect x="20" y="10" width="80" height="50" rx="10" fill="#1e293b" stroke="#2dd4bf" stroke-width="1.5"/>
      <text x="60" y="30" fill="#2dd4bf" font-size="10" text-anchor="middle" font-weight="600">Key</text>
      <text x="60" y="45" fill="#94a3b8" font-size="9" text-anchor="middle">K</text>
      <rect x="20" y="140" width="80" height="50" rx="10" fill="#1e293b" stroke="#818cf8" stroke-width="1.5"/>
      <text x="60" y="160" fill="#818cf8" font-size="10" text-anchor="middle" font-weight="600">Value</text>
      <text x="60" y="175" fill="#94a3b8" font-size="9" text-anchor="middle">V</text>
      <!-- Heads -->
      <g transform="translate(140,0)">
        <rect x="0" y="20" width="70" height="160" rx="8" fill="#1e293b" stroke="#4f46e5" stroke-width="1" stroke-dasharray="4"/>
        <text x="35" y="38" fill="#818cf8" font-size="8" text-anchor="middle">Head 1</text>
        <rect x="10" y="45" width="50" height="28" rx="6" fill="#312e81" stroke="#6366f1" stroke-width="1"/>
        <text x="35" y="63" fill="#e0e7ff" font-size="8" text-anchor="middle">Attention</text>
        <rect x="10" y="85" width="50" height="28" rx="6" fill="#1e3a5f" stroke="#0ea5e9" stroke-width="1"/>
        <text x="35" y="103" fill="#bae6fd" font-size="8" text-anchor="middle">Score</text>
        <rect x="10" y="125" width="50" height="28" rx="6" fill="#1a2e2e" stroke="#2dd4bf" stroke-width="1"/>
        <text x="35" y="143" fill="#99f6e4" font-size="8" text-anchor="middle">Softmax</text>
      </g>
      <g transform="translate(230,0)">
        <rect x="0" y="20" width="70" height="160" rx="8" fill="#1e293b" stroke="#4f46e5" stroke-width="1" stroke-dasharray="4"/>
        <text x="35" y="38" fill="#818cf8" font-size="8" text-anchor="middle">Head 2</text>
        <rect x="10" y="45" width="50" height="28" rx="6" fill="#312e81" stroke="#6366f1" stroke-width="1"/>
        <text x="35" y="63" fill="#e0e7ff" font-size="8" text-anchor="middle">Attention</text>
        <rect x="10" y="85" width="50" height="28" rx="6" fill="#1e3a5f" stroke="#0ea5e9" stroke-width="1"/>
        <text x="35" y="103" fill="#bae6fd" font-size="8" text-anchor="middle">Score</text>
        <rect x="10" y="125" width="50" height="28" rx="6" fill="#1a2e2e" stroke="#2dd4bf" stroke-width="1"/>
        <text x="35" y="143" fill="#99f6e4" font-size="8" text-anchor="middle">Softmax</text>
      </g>
      <text x="325" y="105" fill="#64748b" font-size="14" text-anchor="middle">⋯</text>
      <g transform="translate(350,0)">
        <rect x="0" y="20" width="70" height="160" rx="8" fill="#1e293b" stroke="#4f46e5" stroke-width="1" stroke-dasharray="4"/>
        <text x="35" y="38" fill="#818cf8" font-size="8" text-anchor="middle">Head h</text>
        <rect x="10" y="45" width="50" height="28" rx="6" fill="#312e81" stroke="#6366f1" stroke-width="1"/>
        <text x="35" y="63" fill="#e0e7ff" font-size="8" text-anchor="middle">Attention</text>
        <rect x="10" y="85" width="50" height="28" rx="6" fill="#1e3a5f" stroke="#0ea5e9" stroke-width="1"/>
        <text x="35" y="103" fill="#bae6fd" font-size="8" text-anchor="middle">Score</text>
        <rect x="10" y="125" width="50" height="28" rx="6" fill="#1a2e2e" stroke="#2dd4bf" stroke-width="1"/>
        <text x="35" y="143" fill="#99f6e4" font-size="8" text-anchor="middle">Softmax</text>
      </g>
      <!-- Concat + Linear -->
      <rect x="440" y="60" width="80" height="80" rx="12" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
      <text x="480" y="96" fill="#fbbf24" font-size="10" text-anchor="middle" font-weight="700">Concat +</text>
      <text x="480" y="112" fill="#fbbf24" font-size="10" text-anchor="middle" font-weight="700">Linear</text>
      <!-- Output -->
      <rect x="560" y="70" width="100" height="60" rx="12" fill="#14532d" stroke="#22c55e" stroke-width="2"/>
      <text x="610" y="96" fill="#86efac" font-size="11" text-anchor="middle" font-weight="700">Output</text>
      <text x="610" y="112" fill="#86efac" font-size="9" text-anchor="middle">Attended</text>
      <!-- Arrows -->
      <line x1="100" y1="100" x2="140" y2="100" stroke="#f59e0b" stroke-width="1.5" marker-end="url(#arr)"/>
      <line x1="100" y1="35" x2="140" y2="60" stroke="#2dd4bf" stroke-width="1.5" marker-end="url(#arr)"/>
      <line x1="100" y1="165" x2="140" y2="140" stroke="#818cf8" stroke-width="1.5" marker-end="url(#arr)"/>
      <line x1="420" y1="100" x2="440" y2="100" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#arr)"/>
      <line x1="520" y1="100" x2="560" y2="100" stroke="#22c55e" stroke-width="2" marker-end="url(#arr)"/>
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8"/>
        </marker>
      </defs>
    </svg>`,
  },
  {
    name: 'Gradient Descent',
    paper: 'Deep Learning (Goodfellow et al.)',
    oneLine: 'Iterative optimisation by following the steepest downhill slope on the loss surface',
    visual: `<svg viewBox="0 0 680 200" xmlns="http://www.w3.org/2000/svg" font-family="Inter,sans-serif">
      <rect width="680" height="200" fill="#0f172a"/>
      <!-- Loss surface curve -->
      <path d="M40,30 Q180,180 340,60 Q500,180 640,40" stroke="#4f46e5" stroke-width="2" fill="none" opacity="0.3"/>
      <path d="M40,30 Q180,180 340,60 Q500,180 640,40" stroke="#6366f1" stroke-width="1.5" fill="rgba(79,70,229,0.1)"/>
      <!-- Minimum marker -->
      <circle cx="340" cy="60" r="10" fill="#14532d" stroke="#22c55e" stroke-width="2"/>
      <text x="340" y="63" fill="#86efac" font-size="8" text-anchor="middle" font-weight="700">min</text>
      <!-- Steps with ball -->
      <circle cx="150" cy="148" r="9" fill="#f59e0b" stroke="#fbbf24" stroke-width="2"/>
      <text x="150" y="151" fill="#1c1917" font-size="7" text-anchor="middle" font-weight="700">θ₁</text>
      <circle cx="235" cy="118" r="9" fill="#fb923c" stroke="#fdba74" stroke-width="2"/>
      <text x="235" y="121" fill="#fff" font-size="7" text-anchor="middle" font-weight="700">θ₂</text>
      <circle cx="295" cy="78" r="9" fill="#f97316" stroke="#fdba74" stroke-width="2"/>
      <text x="295" y="81" fill="#fff" font-size="7" text-anchor="middle" font-weight="700">θ₃</text>
      <!-- Step arrows -->
      <path d="M159,143 Q195,135 226,122" stroke="#fbbf24" stroke-width="1.5" fill="none" marker-end="url(#garr)" stroke-dasharray="4"/>
      <path d="M244,113 Q265,97 286,82" stroke="#fdba74" stroke-width="1.5" fill="none" marker-end="url(#garr)" stroke-dasharray="4"/>
      <!-- Labels -->
      <text x="40" y="25" fill="#94a3b8" font-size="9">Loss (J)</text>
      <text x="650" y="50" fill="#94a3b8" font-size="9" text-anchor="end">θ (params)</text>
      <!-- Gradient formula -->
      <rect x="430" y="130" width="220" height="55" rx="10" fill="#1e293b" stroke="#4f46e5" stroke-width="1.5"/>
      <text x="540" y="151" fill="#a5b4fc" font-size="10" text-anchor="middle">Update rule:</text>
      <text x="540" y="170" fill="#e0e7ff" font-size="11" text-anchor="middle" font-weight="600">θ ← θ − α · ∇J(θ)</text>
      <!-- Legend -->
      <circle cx="50" cy="170" r="6" fill="#f59e0b"/>
      <text x="60" y="174" fill="#94a3b8" font-size="9">Current position</text>
      <line x1="130" y1="170" x2="160" y2="170" stroke="#fbbf24" stroke-dasharray="4" stroke-width="1.5"/>
      <text x="165" y="174" fill="#94a3b8" font-size="9">Gradient step</text>
      <defs>
        <marker id="garr" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#fbbf24"/>
        </marker>
      </defs>
    </svg>`,
  },
  {
    name: 'Transformer Architecture',
    paper: 'Attention Is All You Need',
    oneLine: 'Encoder-decoder structure using only self-attention and feed-forward layers',
    visual: `<svg viewBox="0 0 680 200" xmlns="http://www.w3.org/2000/svg" font-family="Inter,sans-serif">
      <rect width="680" height="200" fill="#0f172a"/>
      <!-- Encoder stack -->
      <rect x="20" y="20" width="260" height="160" rx="14" fill="#1e293b" stroke="#2dd4bf" stroke-width="2"/>
      <text x="150" y="42" fill="#2dd4bf" font-size="11" text-anchor="middle" font-weight="700">ENCODER (×6)</text>
      <rect x="40" y="52" width="220" height="34" rx="8" fill="#134e4a" stroke="#2dd4bf" stroke-width="1"/>
      <text x="150" y="74" fill="#99f6e4" font-size="10" text-anchor="middle">Multi-Head Self-Attention</text>
      <rect x="40" y="96" width="220" height="24" rx="8" fill="#1e3a5f" stroke="#38bdf8" stroke-width="1"/>
      <text x="150" y="113" fill="#bae6fd" font-size="9" text-anchor="middle">Add &amp; Norm</text>
      <rect x="40" y="130" width="220" height="24" rx="8" fill="#312e81" stroke="#818cf8" stroke-width="1"/>
      <text x="150" y="147" fill="#c7d2fe" font-size="9" text-anchor="middle">Feed-Forward Network</text>
      <!-- Arrow between enc/dec -->
      <line x1="280" y1="100" x2="400" y2="100" stroke="#f59e0b" stroke-width="2" marker-end="url(#tarr)"/>
      <text x="340" y="93" fill="#fbbf24" font-size="8" text-anchor="middle">K, V</text>
      <!-- Decoder stack -->
      <rect x="400" y="20" width="260" height="160" rx="14" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
      <text x="530" y="42" fill="#f59e0b" font-size="11" text-anchor="middle" font-weight="700">DECODER (×6)</text>
      <rect x="420" y="52" width="220" height="24" rx="8" fill="#451a03" stroke="#f59e0b" stroke-width="1"/>
      <text x="530" y="69" fill="#fed7aa" font-size="9" text-anchor="middle">Masked Multi-Head Attention</text>
      <rect x="420" y="86" width="220" height="24" rx="8" fill="#134e4a" stroke="#2dd4bf" stroke-width="1"/>
      <text x="530" y="103" fill="#99f6e4" font-size="9" text-anchor="middle">Cross-Attention (enc K,V)</text>
      <rect x="420" y="120" width="220" height="24" rx="8" fill="#312e81" stroke="#818cf8" stroke-width="1"/>
      <text x="530" y="137" fill="#c7d2fe" font-size="9" text-anchor="middle">Feed-Forward Network</text>
      <rect x="420" y="154" width="220" height="18" rx="6" fill="#14532d" stroke="#22c55e" stroke-width="1"/>
      <text x="530" y="167" fill="#86efac" font-size="9" text-anchor="middle">Linear + Softmax → Output</text>
      <defs>
        <marker id="tarr" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b"/>
        </marker>
      </defs>
    </svg>`,
  },
];

const FEATURES = [
  {
    icon: Eye,
    title: 'XAI Visual Diagrams',
    desc: 'AI-generated SVG diagrams showing how each concept actually works — not what the paper says, but the mechanism.',
    color: 'text-indigo-600 bg-indigo-50',
  },
  {
    icon: Zap,
    title: 'Narrated Explainer Clips',
    desc: '45-90 second animated clips with AI narration. The visual comes alive as the concept is explained.',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    icon: Brain,
    title: 'Adaptive Quizzes',
    desc: '3 questions per concept. Short answers evaluated by Gemini. Your confidence score updates in real time.',
    color: 'text-teal-600 bg-teal-50',
  },
  {
    icon: Share2,
    title: 'Shareable Study Packs',
    desc: 'One link bundles all concepts from a paper into a shareable deck. Built for virality.',
    color: 'text-rose-600 bg-rose-50',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-slate-900 text-lg">Conceptra</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Dashboard
            </Link>
            <Link
              href="/upload"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Try free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Now in open beta · 3 papers free
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            Research papers,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-teal-500">
              finally understood.
            </span>
          </h1>

          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
            Upload any paper. Get 5–8 key concepts, each with an XAI visual diagram, plain-English
            explanation, short animated clip, structured notes, and a quiz — all in under 60 seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/upload"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-200 transition-all hover:scale-105"
            >
              Upload your first paper — free <ArrowRight size={20} />
            </Link>
            <p className="text-sm text-slate-400">No sign-up needed for 3 papers</p>
          </div>
        </div>
      </section>

      {/* Sample concept cards */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-sm font-medium text-slate-500 mb-8">
            Sample concept cards from{' '}
            <em className="text-slate-700">Attention Is All You Need</em>
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {SAMPLE_CONCEPTS.map((c) => (
              <div
                key={c.name}
                className="rounded-3xl border border-slate-200 overflow-hidden shadow-sm bg-white"
              >
                <div
                  className="w-full concept-svg"
                  dangerouslySetInnerHTML={{ __html: c.visual }}
                />
                <div className="p-4">
                  <div className="text-xs text-slate-400 mb-1">{c.paper}</div>
                  <h3 className="font-bold text-slate-900">{c.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{c.oneLine}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-12">
            Every concept, fully unpacked
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon size={20} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Launch banner */}
      <section className="py-16 px-6" id="pricing">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm font-semibold text-indigo-700">Free during Product Hunt launch</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Completely free, no limits</h2>
          <p className="text-slate-500 mb-8">Upload as many papers as you want. No credit card, no sign-up required.</p>
          <Link
            href="/upload"
            className="inline-block px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Start for free
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Ready to finally understand your papers?
          </h2>
          <p className="text-indigo-200 mb-8">
            Join researchers at leading universities. Upload your first paper in 30 seconds.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-colors shadow-xl"
          >
            Upload your first paper — free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="text-slate-600 text-sm font-medium">Conceptra</span>
          </div>
          <p className="text-xs text-slate-400">conceptra.ai · research papers, finally understood</p>
        </div>
      </footer>
    </div>
  );
}
