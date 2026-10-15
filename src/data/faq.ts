export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "Di mana lokasi Hololabs?",
    answer: "Alamat venue akan diumumkan di WhatsApp dan Instagram resmi Hololabs menjelang hari show.",
  },
  {
    question: "Jam berapa show berlangsung?",
    answer: "Dua show per hari, masing-masing berdurasi 1,5 jam. Jadwal lengkap ada di bagian Rundown.",
  },
  {
    question: "Apakah Hololabs menerima reservasi?",
    answer: "Ya — reservasi wajib dilakukan sebelum datang. Kursi dialokasikan per show dan terbatas.",
  },
  {
    question: "Bagaimana kebijakan reservasinya?",
    answer:
      "Pilih tanggal dan sesi, isi data pemesan, lalu transfer bank sesuai total. Kursi aktif setelah pembayaran diverifikasi admin.",
  },
  {
    question: "Apa yang akan saya alami di dalam show?",
    answer: "Satu Experience Journey 1,5 jam melewati tujuh babak cerita, dari video mapping sampai custom 3D printing — lihat detailnya di bagian Rundown.",
  },
  {
    question: "Bisa datang berombongan?",
    answer: "Bisa, dari individu sampai grup hingga 50 orang per sesi — tergantung sisa kursi yang tersedia.",
  },
  {
    question: "Apakah ada paket F&B?",
    answer: "Ada beberapa pilihan paket dengan harga berbeda, dipilih langsung saat reservasi.",
  },
  {
    question: "Bagaimana cara membatalkan atau mengubah reservasi?",
    answer: "Hubungi admin lewat WhatsApp dengan menyertakan nomor booking-mu untuk dibantu lebih lanjut.",
  },
];
