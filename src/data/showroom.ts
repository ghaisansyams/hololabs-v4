/**
 * Denah showroom HOLOLABS: nine zones on two floors (plus the offices, which are not open to visitors). The ground floor follows the
 * architectural plan (wing of rooms on the left, hall in the middle, break out area on top,
 * service rooms and entrance on the right); the second floor only holds the viewing deck. The photos are the
 * architectural renders in /public/showroom (an illustration of the space);
 * the texts below are the defaults of the CMS section "Denah showroom".
 * The plan itself is a schematic, not to scale.
 */
export type Floor = "ground" | "mezzanine";

export interface ShowroomZone {
  id: string;
  floor: Floor;
  /** SVG rectangle (or circle) of the zone on the plan, in a 760 x 480 box. */
  shape: { kind: "rect"; x: number; y: number; w: number; h: number } | { kind: "circle"; cx: number; cy: number; r: number };
  /** Where the number badge sits. */
  badge: [number, number];
  /** Short label drawn on the plan ("" = none). */
  tag: string;
  /** Small zones get a smaller badge and label. */
  size?: "sm";
  photos: string[];
  name: string;
  description: string;
}

export const floorLabels: Record<Floor, string> = { ground: "Lantai dasar", mezzanine: "Lantai 2" };

export const showroomZones: ShowroomZone[] = [
  {
    id: "entrance",
    floor: "ground",
    shape: { kind: "rect", x: 695, y: 98, w: 35, h: 84 },
    badge: [712, 140],
    tag: "",
    size: "sm",
    photos: ["/showroom/13.jpg"],
    name: "Registrasi & tiket",
    description:
      "Pengunjung masuk melalui pintu utama berwarna oranye di sisi area parkir, lalu melapor ke petugas registrasi. Petugas memindai QR pada e-tiket, mencocokkan data pemesanan, lalu mengarahkan pengunjung ke aula utama.",
  },
  {
    id: "hall",
    floor: "ground",
    shape: { kind: "rect", x: 208, y: 185, w: 522, h: 261 },
    badge: [340, 245],
    tag: "Aula Utama",
    photos: ["/showroom/14.jpg", "/showroom/16.jpg", "/showroom/26.jpg"],
    name: "Aula Utama",
    description:
      "Aula utama dengan langit-langit tinggi dan rangka baja terbuka. Visual ditampilkan memenuhi dinding aula dengan bantuan proyektor di plafon. Seluruh rangkaian babak Perjalanan HOLOLABS berlangsung di ruang ini.",
  },
  {
    id: "stage",
    floor: "ground",
    shape: { kind: "circle", cx: 480, cy: 340, r: 56 },
    badge: [480, 328],
    tag: "Panggung DJ",
    size: "sm",
    photos: ["/showroom/17.jpg", "/showroom/15.jpg"],
    name: "Panggung DJ",
    description:
      "Panggung DJ berada di tengah aula, berhadapan dengan layar utama. Musik dari DJ menjadi pemicu visual di layar, sesuai konsep pertunjukan DJ interaktif pada babak Rasakan Irama.",
  },
  {
    id: "breakout",
    floor: "ground",
    shape: { kind: "rect", x: 354, y: 34, w: 230, h: 148 },
    badge: [469, 112],
    tag: "Area Santai",
    photos: ["/showroom/33.jpg", "/showroom/27.jpg", "/showroom/29.jpg", "/showroom/28.jpg"],
    name: "Area Santai",
    description:
      "Area duduk dengan meja panjang dari kayu yang terbuka ke aula utama. Letaknya di bawah Balkon Penonton dan dekat tangga ke lantai 2, cocok untuk berdiskusi atau bekerja dengan laptop sebelum dan sesudah sesi.",
  },
  {
    id: "meeting",
    floor: "ground",
    shape: { kind: "rect", x: 208, y: 34, w: 143, h: 148 },
    badge: [279, 100],
    tag: "Area Rapat",
    size: "sm",
    photos: ["/showroom/38.jpg", "/showroom/39.jpg", "/showroom/37.jpg", "/showroom/31.jpg"],
    name: "Area Rapat",
    description:
      "Area pertemuan di lantai dasar dengan meja panjang dan kursi kerja, bersebelahan dengan Area Santai. Beberapa sudutnya dilengkapi dinding video untuk presentasi tim.",
  },
  {
    id: "command",
    floor: "ground",
    shape: { kind: "rect", x: 30, y: 153, w: 175, h: 184 },
    badge: [117, 196],
    tag: "Ruang Kendali",
    photos: ["/showroom/40.jpg"],
    name: "Ruang Kendali",
    description:
      "Ruang kendali yang bersebelahan dengan aula utama. Dinding LED-nya tersusun dari 8 TV dalam dua baris, ditambah meja kerja panjang. Ruang ini dipakai untuk memantau dan mengelola konten visual.",
  },
  {
    id: "pantry",
    floor: "ground",
    shape: { kind: "rect", x: 587, y: 98, w: 105, h: 84 },
    badge: [639, 128],
    tag: "Pantri",
    size: "sm",
    photos: [],
    name: "Pantri & loker",
    description: "Pantri, loker, dan ruang penyimpanan di sisi kanan bangunan, dekat toilet dan meja registrasi.",
  },
  {
    id: "toilet",
    floor: "ground",
    shape: { kind: "rect", x: 587, y: 34, w: 143, h: 60 },
    badge: [658, 54],
    tag: "Toilet & Wudhu",
    size: "sm",
    photos: [],
    name: "Toilet & tempat wudhu",
    description: "Toilet dan tempat wudhu di sisi kanan bangunan, tidak jauh dari Area Santai.",
  },
  {
    id: "viewing",
    floor: "mezzanine",
    shape: { kind: "rect", x: 354, y: 34, w: 230, h: 148 },
    badge: [469, 112],
    tag: "Balkon Penonton",
    photos: ["/showroom/35.jpg", "/showroom/34.jpg", "/showroom/36.jpg"],
    name: "Balkon Penonton",
    description:
      "Satu-satunya ruang di lantai 2: deretan kursi bar yang menghadap langsung ke layar utama aula. Dari ketinggian ini pertunjukan terlihat utuh, dan meja panjangnya cukup untuk bekerja dengan laptop sambil menonton. Akses melalui tangga di dekat Area Santai.",
  },
];

/** HOLOLABS offices on the ground floor (one block above and one below the command room): drawn on the plan, not selectable, not labelled. */
export const officeRooms = [
  { x: 30, y: 34, w: 175, h: 116 },
  { x: 30, y: 340, w: 175, h: 106 },
];

export const showroomDefaults = {
  eyebrow: "Denah ruang pamer",
  title: "Menelusuri ruang HOLOLABS",
  body: "Ruang pamer terdiri atas sembilan zona di dua lantai. Lantai dasar memuat meja registrasi, aula utama, Ruang Kendali, dan area rapat, sedangkan lantai 2 hanya berisi Balkon Penonton. Pilih sebuah zona pada denah untuk melihat fotonya.",
  note: "Denah bersifat ilustrasi dan tidak sesuai skala. Foto adalah render ilustrasi ruang.",
  cta: "Reservasi kunjungan",
  office: "Area kantor HOLOLABS, tidak dibuka untuk umum.",
  zones: showroomZones.map((z) => ({
    name: z.name,
    description: z.description,
    // up to four photos per zone, editable in the CMS ("" = no photo in that slot)
    photo1: z.photos[0] ?? "",
    photo2: z.photos[1] ?? "",
    photo3: z.photos[2] ?? "",
    photo4: z.photos[3] ?? "",
  })),
};
