// Paylaşılan yükleniyor / hata / boş durum bileşenleri.

export function Loading() {
  return <p className="animate-pulse text-cream-200/50">Yükleniyor…</p>;
}

export function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="card border-l-2 border-l-rose-500 p-5 text-sm text-rose-300">
      Veri yüklenemedi: {msg}
    </div>
  );
}

export function Empty({ msg }: { msg: string }) {
  return (
    <div className="card p-8 text-center text-cream-200/50">{msg}</div>
  );
}
