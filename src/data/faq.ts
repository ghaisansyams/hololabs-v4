export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "Berapa lama satu pertunjukan?",
    answer: "Sekitar 90 menit dari registrasi sampai kamu membawa pulang hasil cetak 3D. Datang 10 menit sebelum pertunjukan dimulai.",
  },
  {
    question: "Berapa harga tiketnya?",
    answer: "Rp 100.000 per orang, untuk seluruh 7 babak perjalanan.",
  },
  {
    question: "Apakah bisa datang tanpa reservasi?",
    answer:
      "Tidak. Setiap pertunjukan dibatasi 18 kursi supaya semua tamu bisa berinteraksi langsung, jadi kunjungan wajib reservasi daring lebih dulu.",
  },
  {
    question: "Berapa orang maksimal dalam satu pemesanan?",
    answer:
      "Satu pemesanan untuk maksimal 6 orang. Untuk rombongan lebih besar, sekolah, kantor, atau merek, ajukan pertunjukan privat lewat WhatsApp.",
  },
  {
    question: "Bagaimana cara ganti jadwal atau membatalkan?",
    answer:
      "Hubungi tim HOLOLABS lewat WhatsApp dengan menyebutkan kode pemesanan di e-tiket, sesuai batas waktu yang berlaku. Ketentuan lengkap ditampilkan saat memesan.",
  },
];
