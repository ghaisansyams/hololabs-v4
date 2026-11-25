/**
 * Denah showroom HOLOLABS: the parking lot in front plus six zones on two floors (the pantry and toilets are in the picture but not selectable). The plan is the
 * realistic top-view render in /public/showroom/denah-lantai-dasar.jpg (1784 x 621: the plan part of
 * "Realistic Showroom Floor Plan and Parking Layout.png", cropped without the dimension lines); each zone is a clickable area laid over
 * the room it covers in that picture. The internal rooms on the left (Technical Room, MAC, Green
 * Room, Storage General) are part of the picture but not selectable. The second floor only holds the
 * viewing deck, drawn over the top band of the hall. The photos are the architectural renders in
 * /public/showroom; the texts below are the defaults of the CMS section "Denah showroom".
 */
export type Floor = "ground" | "mezzanine";

export interface ShowroomZone {
  id: string;
  floor: Floor;
  /** Rectangle (or circle) of the zone, in pixels of the 1784 x 621 plan picture. */
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

/** The plan picture and its size in pixels; zone shapes are in these pixels. */
export const PLAN_IMAGE = { src: "/showroom/denah-lantai-dasar.jpg", width: 1784, height: 621 };

/**
 * HOLOLABS internal offices on the plan picture (Technical Room and MAC at the top left, Green Room
 * and Storage General at the bottom left): blurred on the site, not selectable.
 */
export const internalRooms = [
  { x: 24, y: 36, w: 240, h: 160 },
  { x: 24, y: 444, w: 242, h: 146 },
];

export const floorLabels: Record<Floor, string> = { ground: "Lantai 1", mezzanine: "Mezzanine" };

export const showroomZones: ShowroomZone[] = [
  {
    id: "parking",
    floor: "ground",
    shape: { kind: "rect", x: 1030, y: 4, w: 750, h: 612 },
    badge: [1615, 316],
    tag: "Area Parkir",
    photos: ["/showroom/parkir-1.jpg", "/showroom/parkir-12.jpg", "/showroom/13.jpg"],
    name: "Area parkir",
    description:
      "Area parkir mobil dan motor di depan gedung. Dari sini pengunjung masuk ke aula utama melalui pintu utama berwarna oranye.",
  },
  {
    id: "hall",
    floor: "ground",
    shape: { kind: "rect", x: 274, y: 246, w: 702, h: 342 },
    badge: [352, 310],
    tag: "Aula Utama",
    photos: ["/showroom/14.jpg", "/showroom/16.jpg", "/showroom/26.jpg"],
    name: "Aula Utama",
    description:
      "Aula utama dengan langit-langit tinggi dan rangka baja terbuka. Visual ditampilkan memenuhi dinding aula dengan bantuan proyektor di plafon. Seluruh rangkaian babak Perjalanan HOLOLABS berlangsung di ruang ini.",
  },
  {
    id: "stage",
    floor: "ground",
    shape: { kind: "circle", cx: 622, cy: 337, r: 76 },
    badge: [622, 337],
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
    shape: { kind: "rect", x: 466, y: 38, w: 308, h: 204 },
    badge: [504, 192],
    tag: "Area Santai",
    photos: ["/showroom/33.jpg", "/showroom/27.jpg", "/showroom/29.jpg", "/showroom/28.jpg"],
    name: "Area Santai",
    description:
      "Area duduk dengan meja panjang dari kayu yang terbuka ke aula utama. Letaknya di bawah Kursi Penonton dan dekat tangga ke mezzanine, cocok untuk berdiskusi atau bekerja dengan laptop sebelum dan sesudah sesi.",
  },
  {
    id: "meeting",
    floor: "ground",
    shape: { kind: "rect", x: 274, y: 38, w: 186, h: 202 },
    badge: [432, 66],
    tag: "Area Rapat",
    size: "sm",
    photos: ["/showroom/30.jpg", "/showroom/31.jpg", "/showroom/32.jpg"],
    name: "Area Rapat",
    description:
      "Area pertemuan di lantai 1 dengan meja panjang dan kursi kerja, bersebelahan dengan Area Santai. Beberapa sudutnya dilengkapi dinding video untuk presentasi tim.",
  },
  {
    id: "command",
    floor: "ground",
    shape: { kind: "rect", x: 26, y: 200, w: 238, h: 242 },
    badge: [76, 246],
    tag: "Ruang Kendali",
    photos: ["/showroom/40.jpg"],
    name: "Ruang Kendali",
    description:
      "Ruang kendali yang bersebelahan dengan aula utama. Dinding LED-nya tersusun dari 8 TV dalam dua baris, ditambah meja kerja panjang. Ruang ini dipakai untuk memantau dan mengelola konten visual.",
  },
  {
    id: "viewing",
    floor: "mezzanine",
    shape: { kind: "rect", x: 274, y: 36, w: 700, h: 206 },
    badge: [624, 140],
    tag: "Kursi Penonton",
    photos: ["/showroom/35.jpg", "/showroom/34.jpg", "/showroom/36.jpg"],
    name: "Kursi Penonton",
    description:
      "Satu-satunya ruang di mezzanine: deretan kursi bar yang menghadap langsung ke layar utama aula. Dari ketinggian ini pertunjukan terlihat utuh, dan meja panjangnya cukup untuk bekerja dengan laptop sambil menonton. Akses melalui tangga di dekat Area Santai.",
  },
];

export const showroomDefaults = {
  eyebrow: "Denah ruang pamer",
  title: "Menelusuri ruang HOLOLABS",
  body: "Denah mencakup area parkir di depan gedung dan enam zona di lantai 1 dan mezzanine. Lantai 1 memuat aula utama, Ruang Kendali, dan area rapat, sedangkan mezzanine hanya berisi Kursi Penonton. Pilih sebuah zona pada denah untuk melihat fotonya.",
  noPhoto: "Foto ruang ini akan segera ditambahkan.",
  floorGround: floorLabels.ground,
  floorUpper: floorLabels.mezzanine,
  swipeHint: "Geser denah ke samping untuk melihat area parkir.",
  planImage: PLAN_IMAGE.src,
  note: "",
  zones: showroomZones.map((z) => ({
    name: z.name,
    tag: z.tag,
    // up to four photos per zone, editable in the CMS ("" = no photo in that slot)
    photo1: z.photos[0] ?? "",
    photo2: z.photos[1] ?? "",
    photo3: z.photos[2] ?? "",
    photo4: z.photos[3] ?? "",
  })),
};
