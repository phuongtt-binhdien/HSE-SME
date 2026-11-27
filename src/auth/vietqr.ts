// Tạo chuỗi VietQR (EMV QR, NAPAS 247 – chuyển nhanh tới tài khoản) và vẽ mã QR tại chỗ — không gọi dịch vụ bên ngoài.
const tlv = (id: string, v: string) => id + String(v.length).padStart(2, "0") + v;
export function crc16(s: string): string {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) { crc ^= s.charCodeAt(i) << 8; for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff; }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
const ascii = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^\x20-\x7e]/g, "");
export function vietQrPayload(o: { bin: string; account: string; amount: number; memo: string }): string {
  const bank = tlv("00", o.bin) + tlv("01", o.account);
  const merchant = tlv("00", "A000000727") + tlv("01", bank) + tlv("02", "QRIBFTTA");
  const body = tlv("00", "01") + tlv("01", "12") + tlv("38", merchant) + tlv("53", "704") + tlv("54", String(Math.round(o.amount))) + tlv("58", "VN") + tlv("62", tlv("08", ascii(o.memo).slice(0, 25))) + "6304";
  return body + crc16(body);
}
export async function qrDataUrl(text: string): Promise<string> {
  const QR = (await import("qrcode")).default;
  return QR.toDataURL(text, { errorCorrectionLevel: "M", margin: 1, width: 280 });
}
