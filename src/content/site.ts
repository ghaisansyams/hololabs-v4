/**
 * Seluruh isi website, satu tempat.
 *
 * Bentuknya sengaja dibuat sama dengan apa yang nanti dikembalikan
 * `get_cms_page()` dan `get_cms_collection()` di Lampiran B PRD: satu objek
 * per section, satu array per koleksi. Ketika CMS dipasang, berkas ini
 * diganti pemanggilan basis data dan komponennya tidak perlu diubah.
 *
 * Sumber teks: company profile_HOLOLABS.pdf, 28 halaman.
 */

export const identity = {
  name: "HOLOLABS",
  tagline: "Where technology becomes experience",
  pillars: ["Immersive", "Interactive", "Intelligent"] as const,
  description:
    "HOLOLABS adalah Creative Technology Lab yang menggabungkan teknologi, kreativitas, konten, dan ruang untuk menciptakan pengalaman baru yang immersive, interactive, dan intelligent.",
  email: "hello@hololabs.id",
  whatsapp: "",
  instagram: "",
  linkedin: "",
  youtube: "",
  tiktok: "",
  address: "",
  // Teks, bukan tanggal yang dihitung saat render: Next 16 menolak nilai
  // yang bisa berubah antar-render di halaman prerender, dan baris ini
  // memang milik admin untuk diubah lewat CMS nanti.
  copyright: "© 2026 HOLOLABS. Seluruh hak cipta dilindungi.",
};

export interface Scene {
  key: string;
  index: string;
  eyebrow: string;
  title: string;
  titleAccent?: string;
  lead?: string;
  body?: string[];
  theme: "dark" | "light";
}

/** Scene 01 — Hero. */
export const hero = {
  key: "hero",
  eyebrow: "A creative technology lab",
  title: "We turn technology",
  titleAccent: "into experience.",
  lead:
    "Projection, display, game, AI, VR, smart space, dan 3D printing yang saling terhubung menjadi satu pengalaman utuh.",
  ctaPrimary: { label: "Pesan Experience Journey", href: "#journey" },
  ctaSecondary: { label: "Diskusikan proyek", href: "#contact" },
  keywords: ["Ideas", "Technology", "Spaces", "People", "Experiences"],
};

/** Scene 02 — Brand Essence & filosofi simbol H. */
export const essence = {
  eyebrow: "Brand essence",
  title: "A bridge between technology",
  titleAccent: "and human experience.",
  body: [
    "Teknologi bukanlah tujuan akhir. Teknologi adalah medium untuk membuat manusia melihat, merasakan, berinteraksi, dan mengalami sesuatu dengan cara yang berbeda.",
  ],
  physical: {
    label: "Physical World",
    text: "Dunia fisik, ruang nyata, manusia dan lingkungan sekitar.",
  },
  digital: {
    label: "Digital World",
    text: "Dunia digital, teknologi, imajinasi dan kemungkinan tanpa batas.",
  },
  bridge: {
    label: "The Experience Bridge",
    text: "Aliran pengalaman yang menghubungkan manusia, ruang, kreativitas, dan teknologi.",
  },
  quote: {
    lead: "Technology gives us the capability.",
    accent: "Creativity turns it into experience.",
  },
};

/** Scene 03 — Integration. */
export const integration = {
  eyebrow: "Integration",
  title: "Integration creates",
  titleAccent: "a bigger experience.",
  body: [
    "HOLOLABS tidak melihat Projection, AI, VR, Interactive Display, Games, Audio Visual, dan Spatial Design sebagai layanan yang terpisah.",
    "Semua dapat saling terhubung menjadi sebuah integrated experience ecosystem.",
  ],
  layers: [
    { label: "Transparent", text: "Keterbukaan, fleksibilitas dan kolaborasi." },
    { label: "Overlapping", text: "Integrasi berbagai teknologi dan kreativitas." },
    { label: "Layered", text: "Banyak dimensi pengalaman yang saling terhubung." },
  ],
  ecosystem: [
    { label: "Technology", text: "Projection, LED, AR/VR, AI, Sensors, Interactive Display" },
    { label: "Content", text: "Storytelling, Visual, Motion, Music, Game" },
    { label: "Space", text: "Physical Space, Virtual Space, Spatial Design" },
    { label: "Interaction", text: "People, Participation, Real-time Response, Multi-sensory" },
    { label: "Experience", text: "Immersive, Interactive, Intelligent" },
  ],
};

/** Scene 04 — Color Journey. */
export const colorJourney = {
  eyebrow: "Filosofi warna",
  title: "Colors that tell",
  titleAccent: "a journey.",
  lead:
    "Warna pada logo bukan hanya estetika futuristik, tetapi bagian dari cerita HOLOLABS.",
  stops: [
    {
      label: "Technology",
      color: "cyan",
      items: ["Technology", "Digital", "Innovation"],
      caption: "Expanding what's possible",
    },
    {
      label: "Creativity",
      color: "violet",
      items: ["Creativity", "Imagination", "Immersion"],
      caption: "Turning ideas into emotion",
    },
    {
      label: "Experience",
      color: "magenta",
      items: ["Energy", "Emotion", "Human Experience"],
      caption: "Creating new realities",
    },
  ],
};

/** Scene 05 — Our DNA, lima karakter brand. */
export const brandCharacters = [
  { key: "futuristic", title: "Futuristic", text: "Exploring what technology can become." },
  { key: "experimental", title: "Experimental", text: "Testing new ideas and possibilities." },
  { key: "immersive", title: "Immersive", text: "Bringing people inside the experience." },
  { key: "interactive", title: "Interactive", text: "Turning audiences into participants." },
  {
    key: "intelligent",
    title: "Intelligent",
    text: "Creating technology that understands, responds, and adapts.",
  },
];

/** Scene 06–09 — delapan area layanan beserta sub-layanannya. */
export interface Solution {
  key: string;
  no: string;
  title: string;
  headline: string;
  lead: string;
  items: { title: string; text: string }[];
}

export const solutions: Solution[] = [
  {
    key: "projection",
    no: "01",
    title: "Projection",
    headline: "Turn any surface into a story.",
    lead:
      "Mengubah ruang, bangunan, object, stage, maupun permukaan apa pun menjadi medium visual storytelling yang imersif, interaktif, dan tak terlupakan.",
    items: [
      {
        title: "Projection Mapping",
        text: "Mengubah bangunan, object, stage, maupun ruang menjadi medium visual storytelling.",
      },
      {
        title: "Immersive Projection",
        text: "Menciptakan environment visual yang membawa audience masuk ke dalam pengalaman.",
      },
      {
        title: "Interactive Projection",
        text: "Projection yang dapat merespons gerakan, sentuhan, sensor, atau aktivitas audience.",
      },
      {
        title: "AV Performance",
        text: "Integrasi visual, projection, audio, music, dan performance menjadi pengalaman audio visual yang imersif.",
      },
    ],
  },
  {
    key: "display",
    no: "02",
    title: "Display",
    headline: "More than a screen.",
    lead:
      "Display bukan sekadar layar, tetapi titik temu antara informasi, brand, dan orang yang melewatinya.",
    items: [
      {
        title: "Digital Signage",
        text: "Dynamic digital communication untuk berbagai kebutuhan informasi dan brand.",
      },
      { title: "Interactive Kiosk", text: "Interactive information dan service point berbasis touchscreen." },
      {
        title: "Immersive & Interactive Display",
        text: "Display yang mengajak audience masuk dan berinteraksi dengan content.",
      },
      {
        title: "LED Display",
        text: "Flexible visual platform untuk event, installation, retail, dan experience space.",
      },
      {
        title: "Holobox",
        text: "Visual display yang menciptakan pengalaman dimensional dan holographic-style presentation.",
      },
      {
        title: "Interactive Content",
        text: "Content digital yang dirancang untuk merespons dan melibatkan audience.",
      },
    ],
  },
  {
    key: "game",
    no: "03",
    title: "Game & Simulation",
    headline: "Don't just watch. Play.",
    lead: "The audience becomes part of the experience.",
    items: [
      {
        title: "Holo-Wall Interactive Games",
        text: "Interactive wall experience yang merespons gerakan pemain.",
      },
      { title: "Holo-X Gesture Games", text: "Gesture-based gaming tanpa conventional controller." },
      { title: "Educational Games", text: "Learning experience melalui permainan dan interaksi." },
      {
        title: "Simulation Experiences",
        text: "Digital simulation untuk education, training, entertainment, maupun brand experience.",
      },
      {
        title: "Custom Games & Activations",
        text: "Game dan interactive activation yang dirancang khusus sesuai kebutuhan brand, event, maupun audience.",
      },
    ],
  },
  {
    key: "ai",
    no: "04",
    title: "AI Solutions",
    headline: "Intelligence that works with you.",
    lead: "AI for experience, AI for business.",
    items: [
      {
        title: "AI Photobooth",
        text: "AI-powered photo experience untuk event, activation, entertainment, dan personalized content.",
      },
      {
        title: "Agentic AI Admin",
        text: "AI assistant untuk membantu proses administrasi dan pekerjaan rutin.",
      },
      { title: "Agentic AI Finance", text: "AI support untuk workflow dan informasi keuangan." },
      {
        title: "Agentic AI Legal & Compliance",
        text: "AI assistance untuk workflow legal, documentation, dan compliance.",
      },
      {
        title: "Agentic AI Marketing",
        text: "AI untuk membantu content, marketing workflow, insight, dan engagement.",
      },
      {
        title: "Agentic AI Customer Support",
        text: "AI-powered conversational assistance untuk membantu interaksi dan pelayanan pelanggan.",
      },
    ],
  },
  {
    key: "vr",
    no: "05",
    title: "VR Solutions",
    headline: "Step into another reality.",
    lead: "Virtual environment yang bisa dimasuki, bukan hanya ditonton.",
    items: [
      { title: "VR Games", text: "Immersive gaming dalam virtual environment." },
      {
        title: "VR Experience",
        text: "Virtual experience untuk entertainment, storytelling, simulation, dan activation.",
      },
      {
        title: "VR for Education",
        text: "Interactive virtual learning yang memungkinkan peserta belajar melalui pengalaman.",
      },
    ],
  },
  {
    key: "printing",
    no: "06",
    title: "3D Printing & Custom",
    headline: "From digital idea to physical form.",
    lead: "Design, customize, print, create.",
    items: [
      {
        title: "3D Printed Shoes",
        text: "Eksplorasi footwear melalui digital design dan additive manufacturing.",
      },
      {
        title: "Custom Action Figure",
        text: "Personalized character dan collectible object melalui 3D modelling dan printing.",
      },
      {
        title: "Custom 3D Design",
        text: "Pembuatan prototype, object, product, props, dan berbagai bentuk custom berdasarkan kebutuhan.",
      },
    ],
  },
  {
    key: "smart",
    no: "07",
    title: "Smart Home & Office",
    headline: "From smart space to intelligent space.",
    lead: "The space itself becomes intelligent.",
    items: [
      {
        title: "Smart Home AI Avatar",
        text: "Virtual AI assistant yang menjadi interface antara manusia dan teknologi di dalam rumah.",
      },
      {
        title: "Smart Office AI Avatar",
        text: "AI avatar sebagai interactive assistant untuk workplace, information, communication, dan connected office experience.",
      },
    ],
  },
  {
    key: "djvj",
    no: "08",
    title: "DJ / VJ Audio Reactive",
    headline: "See the music. Feel the visual.",
    lead: "Performance tidak hanya didengar. It can be seen, felt, and experienced.",
    items: [
      {
        title: "DJ Music Performance",
        text: "Music performance yang dipadukan dengan visual dan immersive environment.",
      },
      {
        title: "Audio Reactive Interactive Performance",
        text: "Visual, lighting, projection, dan interactive content yang bereaksi secara real-time terhadap musik dan audio.",
      },
    ],
  },
];

/** Scene 10 — The HOLOLABS Ecosystem. */
export const ecosystem = {
  eyebrow: "The HOLOLABS ecosystem",
  title: "Everything",
  titleAccent: "can connect.",
  lead:
    "HOLOLABS tidak melihat Projection, AI, VR, Interactive Display, Games, Audio Visual, Smart Technology, 3D Printing, dan Spatial Design sebagai layanan yang terpisah. Semuanya dapat saling terhubung.",
  layers: [
    {
      key: "immersive",
      title: "Immersive",
      items: ["Projection", "Visual", "Audio", "VR", "Spatial"],
    },
    {
      key: "interactive",
      title: "Interactive",
      items: ["Touch", "Gesture", "Motion", "Games", "Sensor"],
    },
    {
      key: "intelligent",
      title: "Intelligent",
      items: ["AI", "Automation", "Smart Home", "Smart Office"],
    },
    {
      key: "physical",
      title: "Physical",
      items: ["3D Printing", "Custom Object", "Spatial Installation"],
    },
  ],
  closing: "Technology becomes experience.",
};

/** Scene 11 — Experience Journey. */
export const journey = {
  eyebrow: "HOLOLABS Experience Journey",
  title: "Don't just see the technology.",
  titleAccent: "Step inside it.",
  lead:
    "Semua kemampuan HOLOLABS disajikan dalam sebuah Experience Journey yang terbuka bagi individu maupun group.",
  duration: "90 menit",
  steps: [
    {
      no: "01",
      title: "Enter the Story",
      subtitle: "Journey of Life — Immersive Video Mapping",
      minutes: 15,
      text: "Experience dimulai melalui immersive video mapping yang membawa audience mengikuti sebuah visual story.",
    },
    {
      no: "02",
      title: "Feel the Beat",
      subtitle: "Interactive DJ & Audio Reactive Performance",
      minutes: 15,
      text: "Music menjadi trigger bagi visual. Audience tidak hanya menonton, mereka menjadi bagian dari performance.",
    },
    {
      no: "03",
      title: "Meet AI",
      subtitle: "Doocoon AI — 3D Avatar Virtual Assistant",
      minutes: 15,
      text: "Pengunjung dapat berbicara langsung dengan 3D Avatar Virtual Assistant yang merespons audience.",
    },
    {
      no: "04",
      title: "Road to Smart Living",
      subtitle: "Smart Home Technology Experience",
      minutes: 20,
      text: "Menjelajahi perkembangan teknologi rumah dari conventional living menuju connected dan intelligent living.",
    },
    {
      no: "05",
      title: "Create Something",
      subtitle: "Custom 3D Printing Experience",
      minutes: 15,
      text: "Dari dunia digital kembali ke dunia fisik. Ide digital berubah menjadi benda nyata.",
    },
    {
      no: "06",
      title: "Closing",
      subtitle: "Take the Experience Home",
      minutes: 10,
      text: "Go home with a new possibility.",
    },
  ],
  visitorTypes: [
    { key: "individual", label: "Individual", size: "1–3 orang" },
    { key: "family", label: "Friends & Family", size: "4–6 orang" },
    { key: "community", label: "Community", size: "7–30 orang" },
    { key: "school", label: "School & University", size: "7–30 orang" },
    { key: "corporate", label: "Corporate & Team", size: "10–50 orang" },
    { key: "brand", label: "Brand & Client", size: "Sesuai permintaan" },
    { key: "private", label: "Private Group", size: "Sesuai permintaan" },
  ],
};

/** Scene 12 — How we work. */
export const process = {
  eyebrow: "How we work",
  title: "From idea",
  titleAccent: "to experience.",
  steps: [
    { no: "01", title: "Discover", text: "Objective · Audience · Space" },
    { no: "02", title: "Imagine", text: "Concept · Story · Possibility" },
    { no: "03", title: "Design", text: "Visual · Audio · Interaction · Spatial" },
    { no: "04", title: "Develop", text: "Content · Software · Technology" },
    { no: "05", title: "Integrate", text: "Hardware · System · Space" },
    { no: "06", title: "Experience", text: "Launch · Interact · Engage" },
  ],
  why: {
    title: "Why HOLOLABS",
    lead: "Not just a technology provider. Not just a creative studio. Not just an experience space.",
    mix: ["Creative", "Visual", "Audio", "Technology", "Interaction", "Space"],
  },
  vision: {
    eyebrow: "Our vision",
    title: "Exploring",
    titleAccent: "what's next.",
    body: [
      "Kami percaya masa depan berada pada pertemuan antara manusia, ruang, kreativitas, dan teknologi.",
      "HOLOLABS ingin menjadi laboratorium tempat kemungkinan tersebut dieksplorasi, diciptakan, dan dialami.",
    ],
    formula: ["Human", "Technology", "Space"],
  },
  manifesto: {
    lead: "We don't just show technology.",
    accent: "We turn technology into experience.",
    lines: [
      "We explore.",
      "We experiment.",
      "We integrate.",
      "We create.",
      "And we invite people to step inside.",
    ],
  },
};

/** Navigasi scene — nanti jadi tabel navigation_items. */
export const sceneNav = [
  { key: "hero", label: "Hero" },
  { key: "essence", label: "Essence" },
  { key: "integration", label: "Integration" },
  { key: "colors", label: "Colors" },
  { key: "dna", label: "DNA" },
  { key: "solutions", label: "Solutions" },
  { key: "ecosystem", label: "Ecosystem" },
  { key: "journey", label: "Journey" },
  { key: "process", label: "Process" },
  { key: "contact", label: "Contact" },
];

export const budgetRanges = [
  "Di bawah Rp 50 juta",
  "Rp 50 – 150 juta",
  "Rp 150 – 500 juta",
  "Rp 500 juta – 1 miliar",
  "Di atas Rp 1 miliar",
  "Belum ditentukan",
];
