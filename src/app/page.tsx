import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TestCatalogPreview } from "@/components/landing/TestCatalogPreview";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <TestCatalogPreview />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
