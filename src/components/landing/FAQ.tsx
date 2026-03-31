import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    question: "Apakah asesmen ini gratis?",
    answer:
      "Ya, semua asesmen yang tersedia di platform ini dapat diakses secara gratis. Kami percaya bahwa akses terhadap evaluasi kesehatan mental dasar adalah hak setiap orang.",
  },
  {
    question: "Apakah data saya aman dan rahasia?",
    answer:
      "Absolut. Kami tidak mengumpulkan data identitas pribadi Anda. Alamat IP di-hash secara satu arah, dan email (jika Anda memilih untuk menerima laporan) dienkripsi menggunakan standar AES-256-GCM. Kami mematuhi UU Perlindungan Data Pribadi Indonesia (UU PDP).",
  },
  {
    question: "Apakah hasil asesmen ini bisa menggantikan diagnosis profesional?",
    answer:
      "Tidak. Asesmen ini adalah alat skrining, bukan alat diagnosis. Hasilnya memberikan indikasi awal yang dapat membantu Anda memahami kondisi Anda, tetapi diagnosis resmi hanya dapat dilakukan oleh profesional kesehatan mental yang berlisensi.",
  },
  {
    question: "Berapa lama waktu yang dibutuhkan untuk menyelesaikan asesmen?",
    answer:
      "Sebagian besar asesmen membutuhkan waktu 3–10 menit. Setiap tes menampilkan perkiraan durasi di halaman katalog. Anda dapat mengerjakan dengan kecepatan Anda sendiri — tidak ada batas waktu.",
  },
  {
    question: "Bagaimana cara interpretasi hasil skor saya?",
    answer:
      "Setelah menyelesaikan asesmen, Anda akan menerima skor total beserta rentang interpretasi klinis (misalnya: minimal, ringan, sedang, berat). Setiap rentang disertai penjelasan makna dan rekomendasi langkah selanjutnya.",
  },
] as const;

export function FAQ() {
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pertanyaan Umum
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Jawaban atas pertanyaan yang sering diajukan tentang asesmen psikologis kami.
          </p>
        </div>

        {/* Accordion */}
        <Accordion defaultValue={[]} className="mt-12 w-full">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={index} value={`faq-${index}`}>
              <AccordionTrigger className="text-left font-heading text-base font-semibold">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
