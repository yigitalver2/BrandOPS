import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

// Korunan uygulama kabuğu: Nav + içerik + Footer. (Giriş sayfası bunu kullanmaz.)
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
      <Footer />
    </>
  );
}
