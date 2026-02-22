import React, { Suspense } from "react";

import SuccessContent from "./SuccessContent";

const SuccessFallback = () => (
  <div className="flex items-center gap-3 rounded-md border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-200">
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" aria-hidden="true" />
    <span>Loading your personalized report...</span>
  </div>
);

export default function SuccessPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payment successful</h1>
      <Suspense fallback={<SuccessFallback />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
