import type { VanityAdvisorResponse } from "@/types/analysis";

export function ResultCards({ result }: { result: VanityAdvisorResponse }) {
  return (
    <div className="mt-8 space-y-6">
      <section className="card">
        <h2 className="text-xl font-semibold">Overall Aesthetic Summary</h2>
        <p className="mt-2 text-sm text-slate-100">{result.overall_aesthetic_summary}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card">
          <h3 className="text-lg font-semibold text-emerald-300">Strengths</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-100">
            {result.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h3 className="text-lg font-semibold text-amber-300">Areas for Improvement</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-100">
            {result.areas_for_improvement.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <h3 className="text-lg font-semibold">Body Fat Estimate</h3>
        <p className="mt-2 text-sm text-slate-200">
          {result.body_fat_estimate.percentage}%{result.body_fat_estimate.range ? ` (${result.body_fat_estimate.range})` : ""} • {result.body_fat_estimate.confidence} confidence
        </p>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold">Key Ratings</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {Object.entries(result.key_ratings ?? {}).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-md border border-slate-700 px-3 py-2 text-sm">
              <span className="capitalize text-slate-200">{key.replaceAll("_", " ")}</span>
              <span className="font-semibold text-slate-100">{value.toFixed(1)}/10</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold">Personalized Roadmap (3–6 Months)</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-100">
          {result.personalized_roadmap.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold">Style Tips</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-100">
          {result.style_tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold">Limitations</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-200">
          {result.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
