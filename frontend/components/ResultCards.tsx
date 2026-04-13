"use client";

import { useEffect, useRef } from "react";

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

const EXPANDED_SUGGESTIONS: string[] = [
  "Track weekly front/side/back photos in identical lighting and review objectively every Sunday.",
  "Set a strict sleep anchor: same bedtime/wake time 7 days per week for at least 4 weeks.",
  "Hit 8-12k daily steps before adding extra cardio sessions.",
  "Run a 3-day hydration baseline and keep water intake consistent day to day.",
  "Standardize sodium intake so jawline and face fullness fluctuations are minimized.",
  "Eat protein at each meal to support lean tissue while cutting body fat.",
  "Add 25-40g fiber/day to improve satiety and skin-related gut stability.",
  "Use a 300-500 kcal deficit instead of crash dieting to avoid rebound bloat.",
  "Lift 3-5x/week with progressive overload and logbook tracking.",
  "Prioritize rear delts and upper back for better shoulder posture silhouette.",
  "Add twice-weekly neck/trap mobility to reduce rounded-shoulder appearance.",
  "Do 10 minutes of posture drills after each workout session.",
  "Use chin-tuck progressions with pain-free range only.",
  "Upgrade haircut every 3-5 weeks to keep facial framing sharp.",
  "Ask barber for temple/side volume balance to improve face proportions.",
  "Match eyebrow shape to eye axis; avoid over-thinning tails.",
  "Use brow pencil shade one tone lighter than hair for natural density.",
  "Trim/shape facial hair on a fixed cadence, not only before photos.",
  "Keep neckline clean and symmetrical two fingers above Adam's apple.",
  "Use SPF 30+ daily even on cloudy days to prevent pigment setbacks.",
  "Add a gentle nightly retinoid progression if tolerated and clinician-approved.",
  "Use vitamin C in the morning and moisturizer barrier support at night.",
  "Patch-test any active skincare product before full-face use.",
  "Limit late-night sugar and alcohol 4-5 nights/week for less morning puffiness.",
  "Reduce ultra-processed snacks and monitor skin/oiliness changes for 3 weeks.",
  "Whiten teeth in controlled cycles with sensitivity management.",
  "Book dental cleaning before whitening for more even results.",
  "Use lip SPF and occlusive balm nightly for cleaner mouth-area texture.",
  "Use eye-level camera framing for less lens distortion in progress photos.",
  "Avoid wide-angle front camera close-ups for assessment images.",
  "Take all check-in photos at same time of day, ideally morning.",
  "Keep expression neutral for true symmetry comparisons.",
  "Use plain, fitted clothing in scans so body lines read clearly.",
  "Run a 12-week phase: cut, maintain, then micro-bulk only if needed.",
  "Review one bottleneck weekly (sleep, diet, training, grooming) and fix it first.",
  "Add one deload week every 6-8 weeks to prevent burnout and inflammation.",
  "Track waist, weight trend, and photos together; never use one metric alone.",
  "Choose one signature scent and grooming routine to reinforce social presence.",
  "Improve wardrobe fit through shoulders/waist before buying more pieces.",
  "Favor high-contrast outfit palettes that complement your undertone.",
  "Use consistent beard/hair/brow tone harmony to avoid facial mismatch.",
  "Use a weekly exfoliation max 1-2x to avoid barrier damage.",
  "Increase omega-3 intake and monitor skin dryness over 6 weeks.",
  "Keep caffeine earlier in day to protect sleep quality and eye-area recovery.",
  "Practice 3 best angles (front, 45°, side) with posture cues before photos.",
  "Use nasal breathing walks for stress control and reduced facial tension.",
  "Set monthly check-ins with objective goals instead of daily aesthetic judgment.",
  "If considering medication/topicals/procedures, get clinician risk review first.",
  "Treat consistency as leverage: 90 days of boring execution beats 7 days of extremes.",
  "Stop changing multiple variables at once; test one adjustment per 2-week block."
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

  const base = matched.length > 0
    ? matched
    : [
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

  return [
    ...base,
    {
      trigger: /.*/,
      title: "Expanded Suggestion Base (50 Extra Actions)",
      methods: EXPANDED_SUGGESTIONS
    }
  ];
}

function escapePdfText(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]): Uint8Array {
  const wrappedLines = lines.flatMap((line) => wrapPdfLine(line));
  const safeLines = wrappedLines.slice(0, 360);

  const linesPerPage = 48;
  const chunks: string[][] = [];
  for (let i = 0; i < safeLines.length; i += linesPerPage) {
    chunks.push(safeLines.slice(i, i + linesPerPage));
  }
  if (chunks.length === 0) chunks.push([]);

  let nextId = 1;
  const catalogId = nextId++;
  const pagesId = nextId++;
  const fontId = nextId++;

  const objects: string[] = [];
  const pageIds: number[] = [];

  objects.push(`${fontId} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`);

  for (const chunk of chunks) {
    const pageId = nextId++;
    const contentId = nextId++;
    pageIds.push(pageId);

    const content = chunk
      .map((line, idx) => `BT /F1 11 Tf 50 ${770 - idx * 15} Td (${escapePdfText(line)}) Tj ET`)
      .join("\n");

    objects.push(`${contentId} 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`);
    objects.push(
      `${pageId} 0 obj << /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >> endobj`
    );
  }

  const kids = pageIds.map((id) => `${id} 0 R`).join(" ");
  objects.push(`${pagesId} 0 obj << /Type /Pages /Kids [${kids}] /Count ${pageIds.length} >> endobj`);
  objects.push(`${catalogId} 0 obj << /Type /Catalog /Pages ${pagesId} 0 R >> endobj`);

  const sortedObjects = objects
    .map((obj) => ({ obj, id: Number.parseInt(obj.split(" ", 1)[0] ?? "0", 10) }))
    .sort((a, b) => a.id - b.id)
    .map((entry) => entry.obj);

  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of sortedObjects) {
    offsets.push(body.length);
    body += `${obj}\n`;
  }

  const xrefStart = body.length;
  body += `xref\n0 ${sortedObjects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  for (let i = 1; i <= sortedObjects.length; i += 1) {
    body += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }

  body += `trailer << /Size ${sortedObjects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new TextEncoder().encode(body);
}

function downloadPdfReport(result: VanityAdvisorResponse, playbook: PlaybookItem[]): void {
  const lines: string[] = ["Mogmax.org Vanity Advisor Report", "", "Overall Summary:", result.overall_aesthetic_summary, "", "Strengths:"];

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
  anchor.download = "mogmax-report.pdf";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ResultCards({ result, autoDownload = false }: { result: VanityAdvisorResponse; autoDownload?: boolean }) {
  const playbook = getPlaybook(result.areas_for_improvement);
  const hasAutoDownloaded = useRef(false);

  useEffect(() => {
    if (!autoDownload || hasAutoDownloaded.current) return;
    hasAutoDownloaded.current = true;
    downloadPdfReport(result, playbook);
  }, [autoDownload, playbook, result]);

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
