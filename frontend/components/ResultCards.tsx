"use client";

import type { VanityAdvisorResponse } from "@/types/analysis";

type PlaybookItem = {
  trigger: RegExp;
  title: string;
  methods: string[];
};

const PLAYBOOK: PlaybookItem[] = [
  {
    trigger: /skin|acne|clarity|under-eye|texture/i,
    title: "Skin clarity / eye-area freshness",
    methods: [
      "Diet protocol (8-12 weeks): prioritize low-glycemic carbs, 30-40g fiber/day, and omega-3 sources 4-5x/week.",
      "Inflammation control: keep alcohol low, hydrate consistently, and standardize 7.5-9h sleep.",
      "Topicals with clinician plan: retinoid at night + azelaic acid in daytime if tolerated; titrate slowly.",
      "Medical escalation: for persistent acne, discuss prescription pathways (e.g., topical/oral options) with a dermatologist only."
    ]
  },
  {
    trigger: /neck|posture|forward head|shoulder/i,
    title: "Neck line and posture",
    methods: [
      "Corrective block (3x/week): chin tucks 2x12, wall slides 2x12, face pulls 3x15, chest-supported rows 3x10.",
      "Mobility daily: 5 min thoracic extension + 2 sets doorway pec stretch (45 sec).",
      "Progression rule: increase load/volume by ~5-10% weekly max; stop immediately if radiating pain appears."
    ]
  },
  {
    trigger: /body fat|definition|lean|waist|fat/i,
    title: "Leaner look / sharper definition",
    methods: [
      "Calorie setup: run a 300-500 kcal deficit and adjust weekly from trend weight/photos, not day-to-day fluctuations.",
      "Training split: 4 sessions/week with progressive overload on squat/hinge/push/pull patterns.",
      "NEAT target: 8k-12k steps/day to improve fat loss consistency without extreme dieting."
    ]
  },
  {
    trigger: /jaw|face puff|bloat|water/i,
    title: "Jawline sharpness / facial de-bloat",
    methods: [
      "Sodium and hydration consistency: keep both stable day-to-day to reduce visual puffiness swings.",
      "Sleep timing: fixed wake time improves cortisol rhythm and morning facial fluid retention.",
      "Cut late-night high-sodium meals 5-6 days/week for more stable morning jawline definition."
    ]
  },
  {
    trigger: /tanning|pale|tone|complexion/i,
    title: "Skin tone presentation / tanning",
    methods: [
      "Safer option first: use high-quality gradual self-tanner (patch test + exfoliation + moisturizer prep).",
      "Sun-safety baseline: daily SPF 30+ and avoid intentional sunburns; UV overexposure accelerates skin aging.",
      "If considering in-office tanning/cosmetic procedures, get dermatologist guidance and risk counseling first."
    ]
  },
  {
    trigger: /eyebrow|brow|hairline|hair/i,
    title: "Eyebrow and hair framing",
    methods: [
      "Grooming cadence: maintain 10-14 day shaping, avoid over-thinning, and keep brow tails balanced.",
      "Hair framing: choose volume/parting that opens the eye area and supports cheekbone/jaw proportions.",
      "Medical-growth discussion: only consider medication-based growth interventions after physician review of risks."
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
      title: "General execution",
      methods: [
        "Set 3 weekly KPIs: physique, posture, and grooming; review every Sunday.",
        "Track with identical weekly photos and keep one variable change at a time.",
        "Prefer sustainable progression over aggressive spikes to avoid rebounds."
      ]
    }
  ];
}

function escapePdfText(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]): Uint8Array {
  const safeLines = lines.slice(0, 80);
  const content = safeLines
    .map((line, idx) => `BT /F1 11 Tf 50 ${780 - idx * 14} Td (${escapePdfText(line)}) Tj ET`)
    .join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(body.length);
    body += `${obj}\n`;
  }

  const xrefStart = body.length;
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    body += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }

  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new TextEncoder().encode(body);
}

function downloadPdfReport(result: VanityAdvisorResponse, playbook: PlaybookItem[]): void {
  const lines: string[] = [
    "Mog.Ai Vanity Advisor Report",
    "",
    "Overall Summary:",
    result.overall_aesthetic_summary,
    "",
    "Strengths:"
  ];

  result.strengths.forEach((s) => lines.push(`- ${s}`));
  lines.push("", "Areas for Improvement:");
  result.areas_for_improvement.forEach((a) => lines.push(`- ${a}`));
  lines.push(
    "",
    `Body Fat Estimate: ${result.body_fat_estimate.percentage}% ${result.body_fat_estimate.range ? `(${result.body_fat_estimate.range})` : ""} | ${result.body_fat_estimate.confidence}`,
    "",
    "Personalized Steps:"
  );
  result.personalized_steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));

  lines.push("", "Practical Methods:");
  playbook.forEach((item) => {
    lines.push(`* ${item.title}`);
    item.methods.forEach((m) => lines.push(`  - ${m}`));
  });

  lines.push("", "Limitations:");
  result.limitations.forEach((item) => lines.push(`- ${item}`));
  lines.push("", "Medical note: Any pharmaceutical intervention requires licensed doctor supervision.");

  const bytes = buildSimplePdf(lines);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "mog-ai-report.pdf";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ResultCards({ result }: { result: VanityAdvisorResponse }) {
  const playbook = getPlaybook(result.areas_for_improvement);

  return (
    <div className="mt-8 space-y-6">
      <section className="card relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-emerald-500/10" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Overall Aesthetic Summary</h2>
            <p className="mt-2 text-sm text-slate-100">{result.overall_aesthetic_summary}</p>
          </div>
          <button
            type="button"
            onClick={() => downloadPdfReport(result, playbook)}
            className="rounded-md border border-indigo-500 bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-100 hover:bg-indigo-500/30"
          >
            Download PDF report
          </button>
        </div>
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
