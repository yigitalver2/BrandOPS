import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

// Protected app shell: Nav + content + Footer. (Login page does not use this layout.)
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
