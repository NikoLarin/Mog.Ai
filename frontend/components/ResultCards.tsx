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
      "Nutrition method: bias toward lower-glycemic carbs, high-fiber meals, and omega-3 sources for 8-12 weeks.",
      "Recovery method: lock consistent sleep/wake windows and reduce alcohol intake for visible inflammation control.",
      "Topical method: discuss evidence-based skincare (retinoid, azelaic acid, benzoyl peroxide) with a licensed clinician.",
      "Pharma option (doctor-supervised): if persistent acne or inflammation remains, ask a dermatologist about prescription options and risks."
    ]
  },
  {
    trigger: /neck|posture|forward head|shoulder/i,
    title: "Neck line / posture upgrade",
    methods: [
      "Daily 8-10 min posture stack: chin tucks, wall slides, thoracic extension, lower-trap activation.",
      "Strength method: add rows/face-pulls/rear-delt work 2-3x weekly to support shoulder position.",
      "Safety: avoid aggressive neck loading jumps; progress gradually and stop if pain/nerve symptoms appear."
    ]
  },
  {
    trigger: /body fat|definition|lean|waist/i,
    title: "Leaner look / sharper definition",
    methods: [
      "Calorie method: use a moderate deficit (roughly 300-500 kcal/day), not crash dieting.",
      "Training method: prioritize resistance training + daily steps to preserve shape while leaning down.",
      "Protein method: aim for high daily protein consistency to retain muscle and improve visual composition."
    ]
  },
  {
    trigger: /eyebrow|brow|hairline|hair/i,
    title: "Eyebrow & hair framing",
    methods: [
      "Grooming method: maintain a consistent shaping cadence and avoid over-plucking.",
      "Styling method: choose cuts that open the brow and support cheekbone/jaw framing.",
      "Medical-growth option (doctor-supervised): discuss potential therapies (e.g., topical agents) and risk profile with a professional."
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
      title: "General glow-up execution",
      methods: [
        "Run 6-8 week cycles: one clear physique goal, one grooming goal, one posture goal.",
        "Track weekly photos with identical lighting/angle to measure real progress.",
        "Keep changes gradual and sustainable so improvements compound instead of rebounding."
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
          Any pharmaceutical intervention must be discussed with and supervised by a licensed doctor.
        </p>
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
