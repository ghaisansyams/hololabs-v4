/**
 * Denah showroom HOLOLABS: eight zones on two floors (lantai dasar, lantai 2). The photos are the
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
  photos: string[];
  name: string;
  description: string;
}

export const floorLabels: Record<Floor, string> = { ground: "Lantai dasar", mezzanine: "Lantai 2" };

export const showroomZones: ShowroomZone[] = [
  {
    id: "entrance",
    floor: "ground",
    shape: { kind: "rect", x: 170, y: 372, w: 170, h: 80 },
    badge: [255, 400],
    photos: ["/showroom/13.jpg"],
    name: "Pintu masuk & registrasi",
    description:
      "Bangunan bergaya gudang industri dengan pintu utama berwarna oranye. Check-in dilakukan di sini dengan memindai QR pada e-ticket, sebelum pengunjung diarahkan ke aula utama.",
  },
  {
    id: "hall",
    floor: "ground",
    shape: { kind: "rect", x: 30, y: 30, w: 470, h: 336 },
    badge: [150, 110],
    photos: ["/showroom/14.jpg", "/showroom/16.jpg", "/showroom/26.jpg"],
    name: "Experience Hall",
    description:
      "Aula utama dengan langit-langit tinggi dan rangka baja terbuka. Satu sisi dinding berfungsi sebagai layar LED berukuran besar, sementara proyektor di plafon melengkapi visualnya. Seluruh rangkaian babak HOLOLABS Experience Journey berlangsung di ruang ini.",
  },
  {
    id: "stage",
    floor: "ground",
    shape: { kind: "circle", cx: 330, cy: 215, r: 62 },
    badge: [330, 215],
    photos: ["/showroom/17.jpg", "/showroom/15.jpg"],
    name: "Panggung DJ",
    description:
      "Panggung DJ berada di tengah aula, berhadapan dengan layar LED. Musik dari DJ menjadi pemicu visual di layar, sesuai konsep Interactive DJ & Audio Reactive Performance pada babak Feel the Beat.",
  },
  {
    id: "breakout",
    floor: "ground",
    shape: { kind: "rect", x: 510, y: 200, w: 220, h: 166 },
    badge: [620, 283],
    photos: ["/showroom/33.jpg", "/showroom/27.jpg", "/showroom/29.jpg"],
    name: "Break Out Area",
    description:
      "Area duduk dengan meja panjang dari kayu di bawah lantai 2, dekat tangga. Ruang ini tersedia untuk berdiskusi atau bekerja dengan laptop sebelum dan sesudah sesi.",
  },
  {
    id: "meeting-room",
    floor: "ground",
    shape: { kind: "rect", x: 510, y: 30, w: 220, h: 160 },
    badge: [620, 110],
    photos: ["/showroom/28.jpg", "/showroom/31.jpg", "/showroom/30.jpg", "/showroom/32.jpg"],
    name: "Ruang Rapat",
    description:
      "Ruang rapat tertutup berdinding kaca, dengan meja panjang, layar presentasi, dan pencahayaan hangat. Sebagian ruang menghadap pemandangan kota di malam hari.",
  },
  {
    id: "command",
    floor: "ground",
    shape: { kind: "rect", x: 510, y: 372, w: 220, h: 80 },
    badge: [620, 400],
    photos: ["/showroom/40.jpg"],
    name: "Command Center",
    description:
      "Ruang berdinding kayu dengan video wall lebar di bagian depan dan meja kerja panjang. Ruang ini dipakai untuk memantau dan mengelola konten visual.",
  },
  {
    id: "viewing",
    floor: "mezzanine",
    shape: { kind: "rect", x: 30, y: 30, w: 470, h: 76 },
    badge: [265, 54],
    photos: ["/showroom/35.jpg", "/showroom/34.jpg", "/showroom/36.jpg"],
    name: "Viewing Deck",
    description:
      "Deretan kursi bar di lantai 2 yang menghadap langsung ke layar LED. Dari ketinggian ini pertunjukan terlihat utuh, dan meja panjangnya cukup untuk bekerja dengan laptop sambil menonton.",
  },
  {
    id: "meeting-area",
    floor: "mezzanine",
    shape: { kind: "rect", x: 510, y: 30, w: 220, h: 336 },
    badge: [620, 198],
    photos: ["/showroom/38.jpg", "/showroom/39.jpg", "/showroom/37.jpg"],
    name: "Meeting Area",
    description:
      "Area pertemuan di lantai 2 dengan meja panjang dan kursi kerja. Beberapa sudutnya dilengkapi video wall untuk presentasi tim.",
  },
];

export const showroomDefaults = {
  eyebrow: "Denah showroom",
  title: "Menelusuri ruang HOLOLABS",
  body: "Showroom terdiri atas delapan zona di dua lantai. Pilih sebuah zona pada denah untuk melihat fungsi dan gambaran ruangnya, dari pintu masuk, aula utama dengan layar LED, hingga area pertemuan di lantai 2.",
  note: "Denah bersifat ilustrasi dan tidak sesuai skala. Foto adalah render ilustrasi ruang.",
  cta: "Reservasi kunjungan",
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
