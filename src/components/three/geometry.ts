import * as THREE from "three";

/**
 * Geometri logo "H" dibangun lewat kode, bukan dimuat dari berkas .glb.
 *
 * Lampiran A PRD mencatat model logo kaca sebagai aset yang masih harus
 * diproduksi. Sampai berkas itu ada, bentuknya dibangun prosedural supaya
 * website bisa berdiri sendiri — dan karena tidak ada yang diunduh, anggaran
 * 6 MB untuk scene pertama tidak terpakai sama sekali oleh logo.
 */

/** Satu "sayap" logo: persegi panjang bersudut tumpul yang diekstrusi. */
export function wingGeometry(width = 1.5, height = 2.4, radius = 0.42, depth = 0.26) {
  const shape = new THREE.Shape();
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);

  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 3,
    curveSegments: 16,
  });
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Jembatan di tengah logo: permukaan jam pasir yang menyempit di titik temu.
 *
 * Inilah "experience bridge" pada filosofi simbol H (compro halaman 3) —
 * dunia fisik di kiri, dunia digital di kanan, menyatu di pinggang tersempit.
 */
export function bridgeGeometry(
  span = 1.35,
  endRadius = 0.78,
  waistRadius = 0.17,
  segmentsU = 72,
  segmentsV = 40,
) {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segmentsU; i++) {
    const u = i / segmentsU;
    const x = THREE.MathUtils.lerp(-span, span, u);
    // |2u - 1| = 0 di tengah, 1 di ujung. Pangkat > 1 membuat pinggangnya
    // menahan lama sebelum melebar, seperti lekuk pada logo.
    const t = Math.pow(Math.abs(2 * u - 1), 1.7);
    const radius = THREE.MathUtils.lerp(waistRadius, endRadius, t);

    for (let j = 0; j <= segmentsV; j++) {
      const v = (j / segmentsV) * Math.PI * 2;
      const y = Math.cos(v) * radius;
      const z = Math.sin(v) * radius;
      positions.push(x, y, z);
      // Normal permukaan jam pasir condong keluar mengikuti jari-jari.
      const n = new THREE.Vector3(0, Math.cos(v), Math.sin(v)).normalize();
      normals.push(n.x, n.y, n.z);
      uvs.push(u, j / segmentsV);
    }
  }

  const stride = segmentsV + 1;
  for (let i = 0; i < segmentsU; i++) {
    for (let j = 0; j < segmentsV; j++) {
      const a = i * stride + j;
      const b = a + stride;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
