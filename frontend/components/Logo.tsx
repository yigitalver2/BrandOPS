import Link from "next/link";

// Dört numaralı kare = dört ajanlı pipeline (01 İstihbarat → 04 Kampanya).
// Espresso → bakır → tan → açık tan geçişi, bakır bağlantı çizgisiyle.
const SQUARES = [
  { fill: "#2A211C", text: "#F4ECDF", label: "01" },
  { fill: "#A9683A", text: "#F4ECDF", label: "02" },
  { fill: "#C39A6E", text: "#F4ECDF", label: "03" },
  { fill: "#DEC9A9", text: "#6E4A2E", label: "04" },
];

/** Yalnızca dört kareli işaret (mark). Yükseklik `className` ile ayarlanır. */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 208 44"
      className={className}
      role="img"
      aria-label="BrandOPS"
      fill="none"
    >
      {/* Kareleri bağlayan bakır hat (karelerin altında kalır, yalnız boşluklarda görünür) */}
      <line x1="8" y1="22" x2="200" y2="22" stroke="#B0712F" strokeWidth="2" />
      {SQUARES.map((s, i) => {
        const x = i * 52;
        return (
          <g key={s.label}>
            <rect x={x} y="2" width="40" height="40" rx="11" fill={s.fill} />
            <text
              x={x + 20}
              y="23"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="13"
              fontWeight="600"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fill={s.text}
            >
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Bakır vurgulu serif wordmark. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-bold tracking-tight ${className}`}>
      Brand<span className="text-copper-dark">OPS</span>
    </span>
  );
}

/** Tam logo: işaret + wordmark (+ opsiyonel alt başlık), dikey yığın. */
export default function Logo({
  showTagline = false,
  href = "/",
  className = "",
}: {
  showTagline?: boolean;
  href?: string | null;
  className?: string;
}) {
  const content = (
    <span className={`inline-flex flex-col items-start gap-2 ${className}`}>
      <LogoMark className="h-9 w-auto md:h-11" />
      <Wordmark className="text-3xl leading-none md:text-4xl" />
      {showTagline && (
        <span className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-copper-dark/70">
          Autonomous Strategy Engine
        </span>
      )}
    </span>
  );

  if (href === null) return content;
  return (
    <Link href={href} aria-label="BrandOPS — ana sayfa">
      {content}
    </Link>
  );
}
