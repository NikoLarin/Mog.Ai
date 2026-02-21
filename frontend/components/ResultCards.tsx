"use client";

import type { VanityAdvisorResponse } from "@/types/analysis";

type PlaybookItem = {
  trigger: RegExp;
  title: string;
  methods: string[];
};

const PLAYBOOK: PlaybookItem[] = [
  {
    trigger: /skin|acne|clarity|under-eye|texture|pores|pigment/i,
    title: "Skin clarity / eye-area freshness",
    methods: [
      "Diet protocol (8-12 weeks): low-glycemic carb focus, 30-40g fiber/day, omega-3 intake 4-5x/week.",
      "Recovery protocol: fixed sleep/wake window, hydration target, and reduced alcohol for inflammation control.",
      "Topical progression: discuss retinoid + azelaic strategy with a clinician; start low-frequency and titrate.",
      "If stubborn, consult dermatologist for prescription options and risk review before starting treatment."
    ]
  },
  {
    trigger: /eyelash|lashes|lash|brow density|sparse brow|thin brow|eyebrow|brow/i,
    title: "Eyebrow and lash grooming / growth",
    methods: [
      "Set a conservative shaping cadence (every 10-14 days) and avoid aggressive over-plucking.",
      "Use brow castor-oil or peptide serum nightly for 8-12 weeks; patch test first.",
      "If growth is poor, ask a dermatologist about evidence-based options (including prescription pathways) before trying stronger products.",
      "For lashes, prioritize gentle cleansing + non-waterproof mascara on training days to reduce breakage."
    ]
  },
  {
    trigger: /hair color|hair colour|gray|grey|washed out|dull hair|contrast|hair tone|hair dye|hair dying/i,
    title: "Hair color optimization",
    methods: [
      "Book a color consultation and match tone to skin undertone (warm/neutral/cool) instead of picking random shades.",
      "Use semi-permanent tests first before permanent dye so you can calibrate depth without major damage.",
      "Add bond-repair + weekly conditioning mask to maintain shine and prevent brittle texture.",
      "Keep brows/beard tone harmonized with hair color so facial contrast looks intentional."
    ]
  },
  {
    trigger: /teeth|smile|yellow|stain|dull enamel|oral/i,
    title: "Smile and teeth brightness",
    methods: [
      "Start with a hygienist cleaning before whitening so results are more even.",
      "Use peroxide strips or trays on a controlled schedule (e.g. 10-14 sessions), then taper to maintenance.",
      "Use sensitivity toothpaste during whitening blocks and pause if pain spikes.",
      "For deeper discoloration or alignment issues, discuss professional whitening/bonding/ortho with a licensed dentist."
    ]
  },
  {
    trigger: /neck|posture|forward head|shoulder|rounded/i,
    title: "Neck line and posture",
    methods: [
      "3x/week correction block: chin tucks 2x12, wall slides 2x12, face pulls 3x15, chest-supported rows 3x10.",
      "Daily mobility: 5 min thoracic extension + pec stretch 2x45s.",
      "Progress by 5-10% max weekly and stop if radiating pain or numbness appears."
    ]
  },
  {
    trigger: /body fat|definition|lean|waist|fat|cut/i,
    title: "Leaner look / sharper definition",
    methods: [
      "Set a moderate 300-500 kcal deficit, recalibrate weekly via trend weight + consistent comparison photos.",
      "Lift 4 days/week using progressive overload (push/pull/legs/upper-lower).",
      "Keep NEAT high (8-12k steps/day) and protein consistent to preserve muscle shape."
    ]
  },
  {
    trigger: /jaw|face puff|bloat|water retention|puffy/i,
    title: "Jawline sharpness / de-bloat",
    methods: [
      "Stabilize sodium and water day-to-day to reduce visual puffiness variance.",
      "Avoid late-night high-sodium meals most days for cleaner morning definition.",
      "Track morning photos under identical lighting to separate fat change from water fluctuations."
    ]
  },
  {
    trigger: /eyebrow|brow/i,
    title: "Eyebrow detailing",
    methods: [
      "Use a 10-14 day grooming cadence and avoid over-thinning the tails.",
      "Light tint/fill strategy can improve frame symmetry in photos.",
      "Discuss medical-growth options only after physician screening and risk review."
    ]
  },
  {
    trigger: /hairline|hair|framing/i,
    title: "Hair framing and hairline presentation",
    methods: [
      "Choose haircut structure that opens eye area and reinforces cheekbone/jaw lines.",
      "Use volume control products to avoid flattening that narrows perceived facial width.",
      "Any medication/procedure discussions should be clinician-guided and personalized."
    ]
  },
  {
    trigger: /tanning|pale|tone|complexion/i,
    title: "Skin tone presentation / tanning",
    methods: [
      "Prefer gradual self-tanner with patch test and exfoliation prep for safer, controlled tone.",
      "Daily SPF 30+ baseline to avoid UV damage and uneven pigmentation.",
      "Use a 2-shade maximum darkening target to keep results natural and avoid orange cast.",
      "For procedural/cosmetic tanning options, consult dermatologist first for risk counseling."
    ]
  },
  {
    trigger: /lip|chapped|dry lips|mouth area/i,
    title: "Lip and mouth-area polish",
    methods: [
      "Nightly occlusive balm + daytime SPF lip protection to improve texture within 2-3 weeks.",
      "Use gentle exfoliation 1x/week max (no harsh scrubs) to avoid irritation.",
      "Keep hydration/sodium balance stable to reduce dry-mouth look in photos."
    ]
  },
  {
    trigger: /beard|facial hair|patchy beard|mustache/i,
    title: "Facial hair strategy",
    methods: [
      "Choose either clean-shaven or a short boxed beard based on your jaw/cheek density—avoid in-between messy lengths.",
      "Line up neckline 1-2 finger widths above Adam's apple and keep cheek lines symmetrical.",
      "If density is limited, discuss evidence-based growth options with a physician before medicated products."
    ]
  },
  {
    trigger: /dark circles|eye bags|tired eyes|sleep/i,
    title: "Eye-area recovery and alertness",
    methods: [
      "Lock a consistent sleep window (same bedtime/wake time) for 3-4 weeks before judging changes.",
      "Morning cold compress + caffeine eye serum can reduce puffiness for daytime presentation.",
      "If persistent pigment/hollows remain, discuss dermatologist options (topicals/procedures) with risk review."
    ]
  },
  {
    trigger: /symmetry|proportion|facial harmony|angles/i,
    title: "Symmetry and proportions presentation",
    methods: [
      "Use camera at eye level, neutral expression, and straight stance to avoid symmetry distortion.",
      "Practice 3 static poses (front/45-degree/side) to identify your strongest visual angles.",
      "Use consistent grooming and hair parting for week-to-week visual comparability."
    ]
  }
];

function wrapPdfLine(line: string, maxChars = 88): string[] {
  if (line.length <= maxChars) return [line];

  const parts: string[] = [];
  let remaining = line;
  while (remaining.length > maxChars) {
    const slice = remaining.slice(0, maxChars + 1);
    const breakAt = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf("/"), slice.lastIndexOf("-"));
    const cut = breakAt > 20 ? breakAt : maxChars;
    parts.push(remaining.slice(0, cut).trimEnd());
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining.length) parts.push(remaining);
  return parts;
}

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
        "Use identical weekly photos and only change one variable at a time.",
        "Prioritize sustainable progression over aggressive spikes to avoid rebound."
      ]
    }
  ];
}

function escapePdfText(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]): Uint8Array {
  const wrappedLines = lines.flatMap((line) => wrapPdfLine(line));
  const safeLines = wrappedLines.slice(0, 120);
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
  const lines: string[] = ["Mog.Ai Vanity Advisor Report", "", "Overall Summary:", result.overall_aesthetic_summary, "", "Strengths:"];

  result.strengths.forEach((s) => lines.push(`- ${s}`));
  lines.push("", "Areas for Improvement:");
  result.areas_for_improvement.forEach((a) => lines.push(`- ${a}`));
  lines.push("", `Body Fat Estimate: ${result.body_fat_estimate.percentage}% ${result.body_fat_estimate.range ? `(${result.body_fat_estimate.range})` : ""} | ${result.body_fat_estimate.confidence}`, "", "Personalized Steps:");
  result.personalized_steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
  lines.push("", "Practical Methods:");
  playbook.forEach((item) => {
    lines.push(`* ${item.title}`);
    item.methods.forEach((m) => lines.push(`  - ${m}`));
  });
  lines.push("", "Limitations:");
  result.limitations.forEach((item) => lines.push(`- ${item}`));

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
          <button type="button" onClick={() => downloadPdfReport(result, playbook)} className="rounded-md border border-indigo-500 bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-100 hover:bg-indigo-500/30">Download PDF report</button>
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

      <section className="card">
        <h3 className="text-lg font-semibold">Photo Capture Checklist (for most accurate next scan)</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-100">
          <li>Use even front lighting (natural window light or soft diffused light), avoid overhead shadows.</li>
          <li>Take front, left side, right side, and back photos with neutral posture and relaxed face.</li>
          <li>Keep camera at chest/eye level, same distance each shot, and avoid wide-angle lens distortion.</li>
          <li>Wear fitted/plain clothing and keep background uncluttered for better contour visibility.</li>
        </ul>
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
        <p className="mt-3 rounded-md bg-rose-500/15 px-3 py-2 text-xs text-rose-100">Any pharmaceutical or prescription intervention requires informed consent and licensed doctor supervision.</p>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold">Body Fat Estimate</h3>
        <p className="mt-2 text-sm text-slate-200">{result.body_fat_estimate.percentage}%{result.body_fat_estimate.range ? ` (${result.body_fat_estimate.range})` : ""} • {result.body_fat_estimate.confidence} confidence</p>
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
