import { LogoMark, Wordmark } from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-espresso-700/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-8 text-sm text-cream-200/50">
        <p className="flex items-center gap-2.5">
          <LogoMark className="h-6 w-auto" />
          <Wordmark className="text-lg" />
          <span className="font-display text-cream-200/60">· Ürün Gereksinimleri v1.0</span>
        </p>
        <p>
          CDSG × Food Empire — pazar girişi stratejisi ve kampanya tasarımı için
          otonom bir motor. AI-Powered IMC ders projesi.
        </p>
      </div>
    </footer>
  );
}
