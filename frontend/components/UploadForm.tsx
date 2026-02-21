"use client";

import { useMemo, useState } from "react";

import { ResultCards } from "@/components/ResultCards";
import { analyzePhotos } from "@/lib/api";
import type { VanityAdvisorResponse } from "@/types/analysis";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VanityAdvisorResponse | null>(null);

  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files ?? []).filter((file) => ACCEPTED_TYPES.includes(file.type));
    setFiles(incoming.slice(0, 4));
    setError(null);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (files.length < 2) {
      setError("Please upload at least 2 photos (front + side minimum).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const analysis = await analyzePhotos({
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
      setResult(analysis);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form className="card space-y-4" onSubmit={onSubmit}>
        <div>
          <h2 className="text-xl font-semibold">Upload photos</h2>
          <p className="mt-1 text-sm text-slate-300">2–4 photos: front, side, back, and optional flexed shot.</p>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-600 p-6 text-center hover:border-slate-400">
          <span className="text-sm text-slate-200">Drop files here or click to browse</span>
          <span className="mt-1 text-xs text-slate-400">JPEG, PNG, WEBP only</span>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />
        </label>

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
            <button
              type="button"
              onClick={() => setUnitSystem("metric")}
              className={`rounded px-3 py-1 ${unitSystem === "metric" ? "bg-indigo-500 text-white" : "text-slate-300"}`}
            >
              Metric (cm / kg)
            </button>
            <button
              type="button"
              onClick={() => setUnitSystem("imperial")}
              className={`rounded px-3 py-1 ${unitSystem === "imperial" ? "bg-indigo-500 text-white" : "text-slate-300"}`}
            >
              Imperial (ft/in / lbs)
            </button>
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

        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        >
          <option value="">Gender (optional)</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non-binary">Non-binary</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>

        <textarea
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          placeholder="Goals (e.g., leaner face, stronger neck posture, better eyebrow density)"
          rows={4}
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />

        {error && <p className="rounded-md bg-rose-500/20 px-3 py-2 text-sm text-rose-200">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Analyze my photos"}
        </button>

        <p className="text-xs text-slate-400">v2: progress photo timeline + change tracking will be added later.</p>
      </form>

      {result ? <ResultCards result={result} /> : null}
    </div>
  );
}
