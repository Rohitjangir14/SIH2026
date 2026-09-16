import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Key,
  CreditCard,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Play,
} from 'lucide-react';

export const SecurityView: React.FC = () => {
  const [testInput, setTestInput] = useState(
    'user=ronak password=SuperSecretPassword123! token=Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token_payload.signature api_key=sk_live_9928192831'
  );
  const [maskedOutput, setMaskedOutput] = useState<string | null>(null);

  const simulateMasking = () => {
    let result = testInput;
    // Password masking
    result = result.replace(/\b(password|passwd|pwd|secret)\s*[:=]\s*([^\s,;"]+|"[^"]*")/gi, '$1=********');
    // Bearer token masking
    result = result.replace(/\b(bearer\s+)[a-zA-Z0-9_\-\.]{20,}/gi, '$1[REDACTED_JWT_TOKEN]');
    // API key masking
    result = result.replace(/\b(api[_\-]?key|access[_\-]?key|auth[_\-]?token)\s*[:=]\s*([^\s,;"]+|"[^"]*")/gi, '$1=[REDACTED_API_KEY]');
    // Credit card masking
    result = result.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED_CARD_NUMBER]');

    setMaskedOutput(result);
  };

  const POLICIES = [
    {
      title: 'Credential & Password Masking',
      icon: Lock,
      desc: 'Redacts password, passwd, pwd, and secret key-values with ******** hashes before writing to processed logs.',
      status: 'Enforced',
      color: 'text-cyan-400',
    },
    {
      title: 'Bearer & JWT Token Redaction',
      icon: Key,
      desc: 'Sanitizes RFC 6750 Bearer Authorization tokens and JWT signatures to prevent session hijacking leaks.',
      status: 'Enforced',
      color: 'text-indigo-400',
    },
    {
      title: 'API & Access Key Shield',
      icon: EyeOff,
      desc: 'Detects stripe, AWS, GCP, and internal secret keys (e.g. sk_live_*, api_key=) and masks them to [REDACTED_API_KEY].',
      status: 'Enforced',
      color: 'text-purple-400',
    },
    {
      title: 'PCI-DSS Credit Card Detection',
      icon: CreditCard,
      desc: 'Matches 13-16 digit payment card numbers and substitutes with [REDACTED_CARD_NUMBER].',
      status: 'Enforced',
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          Security, Privacy & Data Masking
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Zero secret leakage &bull; Automated sensitive field redaction &bull; Audit-ready compliance
        </p>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {POLICIES.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div key={idx} className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <Icon className={`h-4 w-4 ${p.color}`} />
                    {p.title}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Masking Simulation Bench */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Interactive Data Masking Bench
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Type or paste raw log lines with passwords, tokens, or cards to observe real-time pipeline redaction
            </p>
          </div>

          <button
            onClick={simulateMasking}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition active:scale-95"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Simulate Masking
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Test Input String (Containing Passwords or Tokens)
          </label>
          <textarea
            rows={3}
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className="w-full bg-[#070b13] border border-white/10 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/60 leading-relaxed"
          ></textarea>
        </div>

        {maskedOutput && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Cleaned & Masked Result (Stored in Normalized Schema)
            </span>
            <pre className="p-4 rounded-xl bg-[#06090f] border border-emerald-500/30 text-xs font-mono text-emerald-300/90 whitespace-pre-wrap break-all leading-relaxed">
              {maskedOutput}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
