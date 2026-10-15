import QRCode from "qrcode";

/** Server-only: renders a value as a QR code, inlined as a data URL. */
export async function qrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    margin: 1,
    width: 320,
    color: { dark: "#0b0714", light: "#ffffff" },
  });
}
