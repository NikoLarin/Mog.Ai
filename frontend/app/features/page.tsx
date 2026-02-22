import Link from "next/link";

const features = [
  "Upload 2–4 photos (front/side/back) + optional details like age, height, and goals.",
  "AI algorithm analyzes symmetry, skin, posture, and gives a body-fat estimate.",
  "Detailed report with strong points, improvement areas, and actionable playbook (diet, training, grooming, tanning, and more).",
  "Instant PDF report download after your paid unlock.",
  "Anonymous flow — no full account signup required.",
  "Privacy-first processing with temporary scan handling.",
];

const faqs = [
  {
    q: "How accurate is the body-fat estimate?",
    a: "It is a vision-based estimate and should be treated as approximate. Typical confidence bands can vary by lighting, pose, lens distortion, and clothing.",
  },
  {
    q: "Is this medical advice?",
    a: "No. This is an AI optimization/coaching report, not medical advice. Always consult licensed professionals for medical, dermatology, dental, or treatment decisions.",
  },
  {
    q: "What photos work best?",
    a: "Use neutral pose/expression, fitted clothing, plain background, chest-level camera angle, and even lighting. Include front/side/back shots with consistent distance.",
  },
  {
    q: "What is the refund policy?",
    a: "Digital scan purchases are generally final, but if you hit a technical failure during checkout or report generation, contact support and we can review the case.",
  },
  {
    q: "How is my data handled?",
    a: "Photos are prepared for scan processing and are not intended for long-term retention. OpenAI processes inference requests; your data is not used to train models by default.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-teal-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/40 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-teal-300">Mogmax.org Features</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Get Your Personalized AI Vanity Advisor Report – $4.99 One-Time</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          See what the product does, what to expect, and how to get more accurate scans.
          Ready to run your scan? <Link className="text-teal-300 underline" href="/">Start here</Link>.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2">
        {features.map((item) => (
          <article key={item} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-sm text-slate-100">{item}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-xl font-semibold text-slate-100">FAQ</h2>
        <div className="mt-4 space-y-3">
          {faqs.map((item) => (
            <details key={item.q} className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100">{item.q}</summary>
              <p className="mt-2 text-sm text-slate-300">{item.a}</p>
            </details>
          ))}
        </div>
      </section>


      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6">
        <h2 className="text-xl font-semibold text-slate-100">Contact Us</h2>
        <p className="mt-2 text-sm text-slate-300">
          Have questions about features, FAQ details, billing, or report delivery? Reach us at{' '}
          <a className="text-emerald-300 underline" href="mailto:mogmaxbusiness@gmail.com">mogmaxbusiness@gmail.com</a>.
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-teal-300">
          <span>Powered by OpenAI GPT-4o</span>
          <span>•</span>
          <span>Thousands of scans analyzed</span>
        </div>
        <p className="mt-2 text-xs text-slate-400">For educational and appearance-optimization guidance only. Not a substitute for medical advice or diagnosis.</p>
      </section>
    </div>
  );
}
