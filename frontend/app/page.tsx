import { UploadForm } from "@/components/UploadForm";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Vanity AI Advisor</h1>
        <p className="max-w-3xl text-sm text-slate-300">
          Upload 2–4 physique photos and optional stats for brutally honest, visual-only aesthetic feedback.
          This tool is not medical advice and should be treated as directional guidance only.
        </p>
      </header>

      <UploadForm />
    </div>
  );
}
