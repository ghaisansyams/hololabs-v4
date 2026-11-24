export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "Berapa lama satu show?",
    answer: "Sekitar 90 menit dari check-in sampai kamu membawa pulang hasil 3D print. Datang 10 menit sebelum show dimulai.",
  },
  {
    question: "Berapa harga tiketnya?",
    answer: "Rp 100.000 per orang, untuk seluruh 7 babak journey.",
  },
  {
    question: "Apakah bisa datang tanpa reservasi?",
    answer:
      "Tidak. Setiap show dibatasi 18 kursi supaya semua tamu bisa berinteraksi langsung, jadi kunjungan wajib reservasi online lebih dulu.",
  },
  {
    question: "Berapa orang maksimal dalam satu booking?",
    answer:
      "Satu booking untuk maksimal 6 orang. Untuk rombongan lebih besar, sekolah, kantor, atau brand, ajukan private show lewat WhatsApp.",
  },
  {
    question: "Bagaimana cara ganti jadwal atau membatalkan?",
    answer:
      "Hubungi tim HOLOLABS lewat WhatsApp dengan menyebutkan kode booking di e-ticket, sesuai batas waktu yang berlaku. Ketentuan lengkap ditampilkan saat booking.",
  },
];
