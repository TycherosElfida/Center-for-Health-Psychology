import { Metadata } from "next";
import { NavbarWrapper } from "@/components/layout/NavbarWrapper";
import { Footer } from "@/components/landing/Footer";
import ContactContent from "./ContactContent";

export const metadata: Metadata = {
  title: "Contact Us — Center for Health Psychology",
  description: "Hubungi tim Center for Health Psychology untuk pertanyaan atau dukungan.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <NavbarWrapper />
      <ContactContent />
      <Footer />
    </div>
  );
}
