"""PDF okuma yardımcısı — bir yıllık raporu metne çevirir (pdfplumber, pypdf fallback)."""
from pathlib import Path


def extract_text(path: str | Path) -> str:
    """PDF'i düz metne çevirir. pypdf önce (hafif bellek), pdfplumber fallback."""
    path = Path(path)
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(path))
        text = "\n".join((page.extract_text() or "") for page in reader.pages)
        del reader
        if text.strip():
            return text
    except Exception:
        pass

    try:
        import pdfplumber
        parts: list[str] = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                txt = page.extract_text() or ""
                if txt.strip():
                    parts.append(txt)
        return "\n".join(parts)
    except Exception:
        return ""


def discover_reports(reports_dir: Path) -> dict[int, Path]:
    """reports/ içindeki PDF'leri yıla göre eşler. Dosya adında 4 haneli yıl arar.

    Örn: FY2022.pdf, food_empire_2022_annual.pdf -> {2022: path}
    """
    import re

    found: dict[int, Path] = {}
    for pdf in sorted(reports_dir.glob("*.pdf")):
        m = re.search(r"(19|20)\d{2}", pdf.stem)
        if m:
            found[int(m.group(0))] = pdf
    return found
