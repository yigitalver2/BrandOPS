"use client";

// Artifact'ı indirilebilir yapar (JSON). PRD: "Teslim için dışarı aktarılabilir artifact'lar".
export default function ExportButton({
  data,
  filename,
}: {
  data: unknown;
  filename: string;
}) {
  function download() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      disabled={data == null}
      className="inline-flex items-center gap-1.5 rounded-full border border-espresso-600 px-4 py-1.5 text-sm text-cream-100 transition-colors hover:border-copper disabled:opacity-40"
    >
      ↓ JSON indir
    </button>
  );
}
