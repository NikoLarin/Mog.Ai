import type { Insight, VanityAdvisorResponse } from "@/types/analysis";

function InsightCard({ title, insight }: { title: string; insight: Insight }) {
  return (
    <section className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
          {insight.confidence} confidence
        </span>
      </div>
      <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-slate-200">
        {insight.observations.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">Quick wins</p>
      <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-slate-200">
        {insight.quick_wins.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">Cautions</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
        {insight.cautions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function ResultCards({ result }: { result: VanityAdvisorResponse }) {
  return (
    <div className="mt-8 space-y-6">
      <section className="card">
        <h2 className="text-xl font-semibold">Body Fat Estimate</h2>
        <p className="mt-2 text-sm text-slate-200">
          Estimated: <span className="font-semibold">{result.bf_estimate.bf_estimate_percent ?? "N/A"}%</span> ({result.bf_estimate.estimated_range})
        </p>
        <p className="mt-2 inline-block rounded-md bg-rose-500/15 px-2 py-1 text-xs font-medium text-rose-200">
          {result.safety_and_limitations.disclaimer}
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-200">
          {result.bf_estimate.rationale.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <InsightCard title="Eyebrow Advice" insight={result.eyebrow} />
        <InsightCard title="Neck & Posture Advice" insight={result.neck_and_posture} />
      </div>

      <InsightCard title="Symmetry & Skin" insight={result.symmetry_and_skin} />

      <section className="card">
        <h3 className="text-lg font-semibold">Glow-Up Roadmap</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-100">
          {result.glow_up_roadmap.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold">Safety & Limitations</h3>
        <p className="mt-2 text-sm text-slate-200">Safety notes</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-200">
          {result.safety_and_limitations.safety_notes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-slate-200">Limitations</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-200">
          {result.safety_and_limitations.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
