import QRCode from "qrcode";

/** Server-only: renders a value as a QR code, inlined as a data URL. */
export async function qrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    margin: 1,
    width: 320,
    color: { dark: "#0b0714", light: "#ffffff" },
  });
}

/** Server-only: the same QR as a PNG buffer, for an email attachment. */
export async function qrPng(value: string): Promise<Buffer> {
  return QRCode.toBuffer(value, { margin: 1, width: 400, color: { dark: "#0b0714", light: "#ffffff" } });
}
