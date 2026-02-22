"use client";

import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useMemo, useRef, useState } from "react";

import { createCheckout, getPreview, prepareScan } from "@/lib/api";
import type { PreviewReportResponse } from "@/types/analysis";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type UnitSystem = "metric" | "imperial";

export function UploadForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [goals, setGoals] = useState("");

  const [scanId, setScanId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewSectionRef = useRef<HTMLElement | null>(null);
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => {
    if (!preview) return;
    previewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [preview]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files ?? []).filter((file) => ACCEPTED_TYPES.includes(file.type));
    setFiles(incoming.slice(0, 4));
    setScanId(null);
    setPreview(null);
    setError(null);
  };

  const onPrepare = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (files.length < 2) {
      setError("Please upload at least 2 photos (front + side minimum).");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const prepared = await prepareScan({
        images: files,
        height_cm: unitSystem === "metric" ? heightCm : undefined,
        weight_kg: unitSystem === "metric" ? weightKg : undefined,
        height_ft: unitSystem === "imperial" ? heightFt : undefined,
        height_in: unitSystem === "imperial" ? heightIn : undefined,
        weight_lbs: unitSystem === "imperial" ? weightLbs : undefined,
        age,
        gender,
        goals
      });
      setScanId(prepared.scan_id);
      const previewData = await getPreview(prepared.scan_id);
      setPreview(previewData);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onCheckout = async () => {
    if (!scanId) return;

    setCheckoutLoading(true);
    setError(null);
    try {
      const checkout = await createCheckout(scanId);
      const stripe = await loadStripe(checkout.publishable_key);
      if (!stripe) throw new Error("Stripe failed to initialize.");

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: checkout.session_id });
      if (stripeError?.message) throw new Error(stripeError.message);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout.");
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form className="card space-y-4" onSubmit={onPrepare}>
        <div>
          <h2 className="text-xl font-semibold">Upload photos</h2>
          <p className="mt-1 text-sm text-slate-300">Get your free preview now. Unlock your full personalized report for a one-time $4.99.</p>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-600 p-6 text-center hover:border-slate-400">
          <span className="text-sm text-slate-200">Drop files here or click to browse</span>
          <span className="mt-1 text-xs text-slate-400">JPEG, PNG, WEBP only</span>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />
        </label>


        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Photo quality checklist</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-200">
            <li>Use even front lighting and avoid harsh top-down shadows.</li>
            <li>Take front, side, and back shots at the same camera distance.</li>
            <li>Keep neutral pose/expression and avoid extreme camera angles.</li>
            <li>Use plain fitted clothing and clean background for clearer contours.</li>
          </ul>
        </div>

        {previews.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {previews.map(({ file, url }) => (
              <figure key={file.name} className="overflow-hidden rounded-md border border-slate-700">
                <img src={url} alt={file.name} className="h-28 w-full object-cover" />
                <figcaption className="truncate px-2 py-1 text-xs text-slate-300">{file.name}</figcaption>
              </figure>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Units</p>
          <div className="inline-flex rounded-md border border-slate-700 p-1 text-sm">
            <button type="button" onClick={() => setUnitSystem("metric")} className={`rounded px-3 py-1 ${unitSystem === "metric" ? "bg-indigo-500 text-white" : "text-slate-300"}`}>Metric</button>
            <button type="button" onClick={() => setUnitSystem("imperial")} className={`rounded px-3 py-1 ${unitSystem === "imperial" ? "bg-indigo-500 text-white" : "text-slate-300"}`}>Imperial</button>
          </div>
        </div>

        {unitSystem === "metric" ? (
          <div className="grid gap-3 md:grid-cols-3">
            <input value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="Height (cm)" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="Weight (kg)" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-4">
            <input value={heightFt} onChange={(e) => setHeightFt(e.target.value)} placeholder="Height (ft)" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <input value={heightIn} onChange={(e) => setHeightIn(e.target.value)} placeholder="Height (in)" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <input value={weightLbs} onChange={(e) => setWeightLbs(e.target.value)} placeholder="Weight (lbs)" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          </div>
        )}

        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
          <option value="">Gender (optional)</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non-binary">Non-binary</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>

        <textarea value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="Goals" rows={3} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />

        {error && <p className="rounded-md bg-rose-500/20 px-3 py-2 text-sm text-rose-200">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-60">
            {loading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-transparent" aria-hidden="true" />}
            <span>{loading ? "Generating preview..." : "Generate Free Preview"}</span>
          </button>

          <button
            type="button"
            disabled={!scanId || checkoutLoading}
            onClick={onCheckout}
            className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {checkoutLoading ? "Redirecting..." : "Unlock Full Report – $4.99"}
          </button>
        </div>
      </form>

      {preview && (
        <section ref={previewSectionRef} className="card">
          <h3 className="text-lg font-semibold">Free Preview</h3>
          <p className="mt-2 text-sm text-slate-100">{preview.summary}</p>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-300">Top strengths detected</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-100">
            {preview.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <p className="text-sm font-semibold text-amber-200">{preview.hidden_insights_count}+ hidden weaknesses and fix protocols locked</p>
            <p className="mt-1 text-sm text-amber-100">{preview.tease_line}</p>
            <p className="mt-2 text-xs text-amber-100/80">Unlock to view exact weak points and personalized correction steps.</p>
          </div>
        </section>
      )}
    </div>
  );
}
