import { UploadForm } from "@/components/UploadForm";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-900/40 via-slate-900 to-emerald-900/30 p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-400/20 blur-2xl" />
        <h1 className="text-3xl font-bold tracking-tight">Mog.Ai — Vanity AI Advisor</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-200">
          Upload 2–4 photos and get a balanced, confidence-first breakdown: strengths first, constructive upgrades second,
          then a clear glow-up plan with practical methods you can execute.
        </p>
        <div className="mt-3 inline-flex rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
          Visual estimation only • Not medical diagnosis
        </div>
      </header>

      <UploadForm />
    </div>
  );
}
