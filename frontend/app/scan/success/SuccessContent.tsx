"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ResultCards } from "@/components/ResultCards";
import { analyzePaid } from "@/lib/api";
import type { VanityAdvisorResponse } from "@/types/analysis";

export default function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const scanId = params.get("scan_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VanityAdvisorResponse | null>(null);
  const hasRequested = useRef(false);

  useEffect(() => {
    if (!sessionId || !scanId) {
      setError("Missing payment or scan context.");
      setLoading(false);
      return;
    }

    if (hasRequested.current) return;
    hasRequested.current = true;

    analyzePaid(scanId, sessionId)
      .then((data) => setResult(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to run analysis."))
      .finally(() => setLoading(false));
  }, [scanId, sessionId]);

  return (
    <>
      {loading && (
        <div className="flex items-center gap-3 rounded-md border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-200">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" aria-hidden="true" />
          <span>Running your full premium AI analysis...</span>
        </div>
      )}
      {error && <p className="rounded-md bg-rose-500/20 p-3 text-sm text-rose-100">{error}</p>}
      {result && <ResultCards result={result} autoDownload />}
    </>
  );
}
