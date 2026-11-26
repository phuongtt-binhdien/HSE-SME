// Mặt bằng nhà máy theo "Tổng mặt bằng vị trí" TMB-00 (VietBuild, 2022; file 2026_QUY_HOACH_TONG_THE_MB_UPDATE_NVP2 — bản mới nhất) và Bản vẽ hoàn công TMB-01 ( hệ tọa độ bản vẽ: X hướng Bắc, Y hướng Tây; đơn vị m).
// Hướng thực tế (suy từ bản vẽ + ảnh vệ tinh): X_d = hướng Bắc, Y_d = hướng Tây (sông Vàm Cỏ Đông nằm ở phía "đầu bản vẽ", tức phía Tây;
// cổng chính và đường Trung Trực ở phía Đông). Trong cảnh 3D: x_cảnh (Đông) = −Y_d; z_cảnh (Nam) = −X_d.
// Vị trí và kích thước lấy từ bản vẽ vector (khối nhà, nhãn số hiệu) và bảng liệt kê hạng mục; chiều cao là GIẢ ĐỊNH điển hình.
export type Status = "built" | "planned";
export interface SiteBuilding { id: string; name: string; x0: number; x1: number; y0: number; y1: number; h: number; status: Status; kind: "shed" | "office" | "util" | "tank" | "small"; area?: string; note?: string }

/** TMB-00 (2022): tổng 156.303 m²; xây dựng 56.897,1 (36,40 %) = hiện hữu 45.182,1 + xin phép xây mới 11.715; giao thông, sân bãi 47.966,5; đất trống 16.657,6; cây xanh, mặt nước 34.706,9. (TMB-01 cũ: 140.110 m².) */
export const SITE_AREA_TABLE = { total: 156303, built: 56897.1, existing: 45182.1, planned: 11715, traffic: 47966.5, vacant: 16657.6, green: 34706.9 } as const;

/** Ranh giới sử dụng đất (đỉnh theo thứ tự, tọa độ bản vẽ X_d, Y_d). Đã dựng từ các đường ranh trong bản vẽ; cạnh Tây (sông) theo mép kè. */
export const SITE_BOUNDARY: [number, number][] = [
  [-275, 93], [-194, -249], [-182, -247], [-35, -199], [-10, -191], [2, -195], [58, -179], [89, -175], [160, -180], [232, -180], [232, 112], [100, 108], [-100, 102], [-235, 99],
];
export const MAIN_GATE = { x: -15, y: -205, name: "Cổng chính (phía Đông, đường Trung Trực)" } as const;
export const WHARF = { x0: -126.6, x1: -51.7, y0: 124.1, y1: 148.8, name: "Bến tàu 3000 DWT (21 × 74 m) — sông Vàm Cỏ Đông" } as const;
export const PORT_YARD = { x0: -127, x1: -67, y0: 99, y1: 124, name: "Khu vực cảng + kho ngoài trời (17), 1.489 m²" } as const;

export const SITE_BUILDINGS: SiteBuilding[] = [
  { id: "9A1", name: "Nhà sản xuất 9A1 — dây chuyền tạo hạt (108 × 48 m)", x0: 0, x1: 108, y0: -0.8, y1: 47.2, h: 13, status: "built", area: "5.184 m²", note: "Đã có GPXD" },
  { id: "9B1", name: "Nhà sản xuất 9B1 (108 × 30 m)", x0: 0, x1: 108, y0: 50.2, y1: 80.2, h: 13, status: "built", area: "3.240 m²", note: "Hiện hữu (TMB-00 2022)" },
  { id: "9C1", name: "Nhà sản xuất 9C1 (108 × 30 m)", x0: 0, x1: 108, y0: -32.5, y1: -2.5, h: 13, status: "built", area: "3.240 m²", note: "Hiện hữu (TMB-00 2022)" },
  { id: "28", name: "Nhà xưởng sản xuất 28 — dây chuyền cán ép 30.000 t/năm (108 × 30 m)", x0: 127.8, x1: 157.8, y0: -30.4, y1: 77.5, h: 12, status: "built", area: "3.240 m²" },
  { id: "26", name: "Kho thành phẩm 26 (108 × 30 m)", x0: -40, x1: -10, y0: -30.4, y1: 77.5, h: 11, status: "built", area: "3.240 m²", note: "Hiện hữu (TMB-00 2022)" },
  { id: "38", name: "Kho nguyên liệu 38 (108 × 24 m)", x0: -64.9, x1: -40.9, y0: -30.4, y1: 77.5, h: 11, status: "built", area: "2.592 m²" },
  { id: "27", name: "Kho dự trữ nguyên liệu 27 (126 × 80 m)", x0: -163.9, x1: -84.1, y0: -48.5, y1: 77.5, h: 12, status: "built", area: "10.080 m²" },
  { id: "37", name: "Kho chứa nguyên liệu và sản phẩm 37 (158 × 36 m)", x0: 0, x1: 157.8, y0: -80.4, y1: -44.4, h: 12, status: "built", area: "5.688 m²" },
  { id: "39", name: "Kho nguyên liệu nối dài 39 (58 × 40 m)", x0: -65, x1: -7, y0: -81, y1: -41, h: 11, status: "built", area: "2.320 m²" },
  { id: "40", name: "Nhà nghỉ công nhân 40 (27,4 × 14,4 m)", x0: -42.5, x1: -15.1, y0: -120.2, y1: -105.8, h: 4.5, status: "built", area: "394 m²", kind: "office" } as any,
  { id: "29", name: "Căn tin 29 (42 × 14 m)", x0: 0, x1: 42, y0: -149.9, y1: -135.9, h: 4.5, status: "built", area: "588 m²", kind: "office" } as any,
  { id: "30", name: "Nhà văn phòng 2 (30)", x0: 2, x1: 29.8, y0: -119.9, y1: -99.9, h: 7, status: "built", area: "556 m²", kind: "office" } as any,
  { id: "36", name: "Trạm biến áp 750 kVA (36) — trong nhà", x0: 4, x1: 14, y0: -100, y1: -90, h: 4.5, status: "built", area: "100 m²", kind: "util" } as any,
  { id: "31", name: "Nhà hóa nghiệm 31 (8 × 16 m)", x0: 208, x1: 216, y0: -152, y1: -136, h: 3.8, status: "built", area: "128 m²", kind: "small" } as any,
  { id: "32", name: "Nhà ăn hiện hữu 32 (8 × 16 m)", x0: 214, x1: 222, y0: -134, y1: -118, h: 3.8, status: "built", area: "128 m²", kind: "small" } as any,
  { id: "33", name: "Khu vực đóng bao 33 (8 × 60 m)", x0: 213.8, x1: 221.7, y0: -118, y1: -58, h: 5, status: "built", area: "480 m²", kind: "small" } as any,
  { id: "34", name: "Nhà cơ điện 34 (8 × 40 m)", x0: 210.8, x1: 218.7, y0: -50.1, y1: -10.1, h: 5, status: "built", area: "320 m²", kind: "small" } as any,
  { id: "23", name: "Nhà văn phòng hiện hữu 23 (8,4 × 16 m)", x0: 217, x1: 225.4, y0: -168, y1: -152, h: 4, status: "built", area: "134,4 m²", kind: "office" } as any,
  { id: "11", name: "Khu xử lý nước cấp 11 (24 × 32 m)", x0: 193.8, x1: 217.8, y0: 1, y1: 33, h: 3, status: "built", area: "960 m²", kind: "util" } as any,
  { id: "8", name: "Khu bồn dầu 8 (18 × 20 m)", x0: 196, x1: 214, y0: 36, y1: 56, h: 3, status: "built", area: "360 m²", kind: "util" } as any,
  { id: "35", name: "Nhà thay đồ công nhân 35 (6 × 9 m)", x0: 201, x1: 207, y0: 82.5, y1: 91.5, h: 3.3, status: "built", kind: "small" } as any,
  { id: "7B", name: "Phòng tắm công nhân 7B (6 × 9 m)", x0: 205, x1: 211, y0: 57.5, y1: 66.5, h: 3.3, status: "built", kind: "small" } as any,
  { id: "7A", name: "Nhà vệ sinh 1 (7A) 4 × 9 m", x0: 206, x1: 210, y0: 68.5, y1: 77.5, h: 3.3, status: "built", kind: "small" } as any,
  { id: "24", name: "Nhà đặt máy phát điện 24", x0: 205.5, x1: 210.5, y0: -7, y1: -1, h: 3.3, status: "built", area: "30 m²", kind: "small" } as any,
  { id: "25", name: "Nhà đặt tủ phân phối chính 25", x0: 165, x1: 169, y0: 10, y1: 14, h: 3.3, status: "built", area: "16 m²", kind: "small" } as any,
  { id: "3B", name: "Nhà bảo vệ 2 (3B)", x0: 199, x1: 201, y0: -166, y1: -164, h: 3, status: "built", area: "4 m²", kind: "small" } as any,
  { id: "41", name: "Kho chứa nguyên liệu và thành phẩm 41 (114,64 × 36,44 m)", x0: -199.6, x1: -85, y0: -127.2, y1: -91, h: 12, status: "planned", area: "4.177,5 m²", note: "Xin phép xây mới" },
  { id: "42", name: "Kho chứa nguyên liệu và thành phẩm 42 — giai đoạn 2 (114,64 × 36,44 m)", x0: -199.6, x1: -85, y0: -163.4, y1: -127.2, h: 12, status: "planned", area: "4.177,5 m²", note: "Xin phép xây mới" },
  { id: "43", name: "Kho dự trữ nguyên liệu nối dài 43 (80 × 32 m)", x0: -164.4, x1: -84.4, y0: -80.8, y1: -48.8, h: 12, status: "planned", area: "2.560 m²", note: "Xin phép xây mới" },
  { id: "44", name: "Nhà văn phòng 2 (44) 40 × 20 m", x0: -45, x1: -5, y0: -166, y1: -146, h: 8, status: "planned", area: "800 m²", note: "Xin phép xây mới", kind: "office" } as any,
  { id: "1-5", name: "Khu HTXLNT, nhà điều hành, nhà thí nghiệm, nhà màng, nhà lưới (hạng mục 1–5) — vị trí gần đúng", x0: -205, x1: -125, y0: -250, y1: -190, h: 4.5, status: "built", area: "≈ 1.714 m² (1–5)", note: "Theo nhãn TMB-00; chưa có tọa độ từng nhà", kind: "util" } as any,
];
for (const b of SITE_BUILDINGS as any[]) b.kind ??= "shed";

/** Tháp nước 19 (trong khu xử lý nước cấp). */
export const WATER_TOWER = { x: 214, y: 11, r: 3, h: 18 } as const;
/** Đường nội bộ (dải) theo bản vẽ: 4B giữa cụm nhà 9 và nhà 28; 4A dọc phía Đông. Mỗi phần tử là hình chữ nhật (X_d, Y_d). */
export const SITE_ROADS: { id: string; x0: number; x1: number; y0: number; y1: number }[] = [
  { id: "4B", x0: 110, x1: 126, y0: -100, y1: 100 },
  { id: "4A", x0: 176, x1: 188, y0: -168, y1: 106 },
  { id: "R1", x0: -170, x1: 232, y0: -98, y1: -86 },
  { id: "R2", x0: -170, x1: 232, y0: 82, y1: 96 },
];

/** Bản vẽ → cảnh 3D (x Đông, z Nam, y lên). */
export const toScene = (Xd: number, Yd: number): [number, number] => [-Yd, -Xd];
/** Hộp của một hạng mục trong cảnh: tâm (x, z), kích thước theo x (Đông–Tây) và z (Bắc–Nam). */
export function sceneBox(b: { x0: number; x1: number; y0: number; y1: number }) {
  const [cx, cz] = toScene((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2);
  return { cx, cz, w: Math.abs(b.y1 - b.y0), d: Math.abs(b.x1 - b.x0) };
}
/** Diện tích đa giác (m²) — công thức dây giày. */
export function polygonArea(p: [number, number][]) { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; }
