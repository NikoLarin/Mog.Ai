import type { VanityAdvisorResponse } from "@/types/analysis";

type PlaybookItem = {
  trigger: RegExp;
  title: string;
  methods: string[];
};

const PLAYBOOK: PlaybookItem[] = [
  {
    trigger: /skin|acne|clarity|under-eye|texture/i,
    title: "Clearer skin / fresher eye area",
    methods: [
      "Diet: run an 8-12 week lower-glycemic nutrition block (whole foods, high fiber, omega-3s, fewer ultra-processed foods).",
      "Recovery: 7.5-9h sleep target + alcohol minimization to reduce inflammation and improve skin texture.",
      "Topicals (with clinician guidance): discuss retinoid/azelaic acid/benzoyl peroxide protocol and irritation management.",
      "Medical treatment: ask a dermatologist about prescription options if stubborn acne/inflammation persists; use only with doctor supervision."
    ]
  },
  {
    trigger: /neck|posture|forward head|shoulder/i,
    title: "Neck line / posture upgrade",
    methods: [
      "Exercise block (3x/week): chin tucks 2x12, wall slides 2x12, face pulls 3x15, chest-supported rows 3x10.",
      "Daily mobility: thoracic extension over foam roller 5 minutes + doorway pec stretch 2x45s.",
      "Safety: avoid aggressive neck loading jumps; increase volume/load gradually and stop with pain or nerve symptoms."
    ]
  },
  {
    trigger: /body fat|definition|lean|waist/i,
    title: "Leaner look / sharper definition",
    methods: [
      "Nutrition: maintain a moderate 300-500 kcal deficit with weekly adjustment based on trend weight and photos.",
      "Training: 3-5 resistance sessions/week (squat/hinge/push/pull) + 8-12k daily steps.",
      "Composition support: keep protein high and stable to preserve muscle while cutting."
    ]
  },
  {
    trigger: /eyebrow|brow|hairline|hair/i,
    title: "Eyebrow & hair framing",
    methods: [
      "Grooming: keep a strict 10-14 day eyebrow maintenance cadence; avoid over-thinning.",
      "Styling: select haircut volume/parting that opens the brow and frames jaw-cheek lines.",
      "Medical option: discuss evidence-based growth interventions only with a licensed doctor and review side effects first."
    ]
  }
];

function getPlaybook(areas: string[]): PlaybookItem[] {
  const text = areas.join(" ");
  const matched = PLAYBOOK.filter((item) => item.trigger.test(text));
  if (matched.length > 0) return matched;

  return [
    {
      trigger: /.*/,
      title: "General 6-month glow-up execution",
      methods: [
        "Lock one physique KPI, one posture KPI, and one grooming KPI each month.",
        "Take weekly comparison photos in identical lighting/angle to stay objective.",
        "Use gradual, sustainable changes to avoid rebound and preserve momentum."
      ]
    }
  ];
}

export function ResultCards({ result }: { result: VanityAdvisorResponse }) {
  const playbook = getPlaybook(result.areas_for_improvement);

  return (
    <div className="mt-8 space-y-6">
      <section className="card relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-emerald-500/10" />
        <h2 className="text-xl font-semibold">Overall Aesthetic Summary</h2>
        <p className="mt-2 text-sm text-slate-100">{result.overall_aesthetic_summary}</p>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold">Personalized Steps</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {result.personalized_steps.map((step, idx) => (
            <div key={step} className="rounded-lg border border-indigo-700/40 bg-indigo-950/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">Step {idx + 1}</p>
              <p className="mt-1 text-sm text-slate-100">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card">
          <h3 className="text-lg font-semibold text-emerald-300">Your Strong Points</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-100">
            {result.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h3 className="text-lg font-semibold text-amber-300">Constructive Improvements</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-100">
            {result.areas_for_improvement.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <h3 className="text-lg font-semibold">Action Playbook (Practical Methods)</h3>
        <div className="mt-3 space-y-3">
          {playbook.map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
              <p className="text-sm font-semibold text-indigo-300">{item.title}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-100">
                {item.methods.map((method) => (
                  <li key={method}>{method}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-md bg-rose-500/15 px-3 py-2 text-xs text-rose-100">
          Any pharmaceutical or prescription intervention requires informed consent and licensed doctor supervision.
        </p>
      </section>

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
            <div key={key} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="capitalize text-slate-200">{key.replaceAll("_", " ")}</span>
                <span className="font-semibold text-slate-100">{value.toFixed(1)}/10</span>
              </div>
              <div className="h-2 w-full rounded bg-slate-800">
                <div className="h-2 rounded bg-indigo-500" style={{ width: `${Math.max(0, Math.min(100, value * 10))}%` }} />
              </div>
            </div>
          ))}
        </div>
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
