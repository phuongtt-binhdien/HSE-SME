#!/usr/bin/env python3
"""JSON (parse_stats.py) → src/data/production2026.ts. Dùng: python3 scripts/stats/gen_ts.py prod.json"""
import json, sys
d = json.load(open(sys.argv[1])); g = d['granulation']
body = {m: {'machines': v['machines'], 'daily': v['daily'], 'rawTons': v['rawTons'], 'other': v['other']} for m, v in g.items()}
ts = '''// Thống kê sản xuất và nguyên liệu 04–08/2026 — sinh tự động từ THONG_KE_NGUYEN_LIEU_THANG_04…08.2026.xls bằng scripts/stats/parse_stats.py (không sửa tay).
// Sản lượng quy đổi từ số bao × khối lượng bao (cột LOẠI SP); nguyên liệu: bao 50 kg → tấn. TH1H/TH2H/TH3H = máy 1/2/3.
export type MachineKey = "TH1H" | "TH2H" | "TH3H";
export interface MachineMonth { ca: number; hours: number; downH: number; tons: number; coalLoKg: number; coalNoiKg: number; kWh: number; kWhRuns: number; biomassKg: number; biomassRuns: number; maccaBanh: number; vienNenBanh: number; topProducts: [string, number][] }
export interface DayCell { h: number; t: number; bio: number; coal: number }
export interface MonthData { machines: Partial<Record<MachineKey, MachineMonth>>; daily: Partial<Record<MachineKey, Record<string, DayCell>>>; rawTons: Record<string, number>; other: { "TK TRON"?: Record<string, { tons: number; hours: number; kWh: number; ca: number; coalKg: number }>; "TK XLNL"?: Record<string, { tons: number; hours: number; kWh: number; ca: number; coalKg: number }>; packing: Record<string, number> } }
export const PROD_MONTHS = ["04", "05", "06", "07", "08"] as const;
/** Máy 2 = tạo hạt 3 theo GPMT (xác nhận của Nhà máy). Máy 3 = tạo hạt 2 và máy 1 = tạo hạt 1 là SUY RA (chạy thử sinh khối ở máy 3 khớp với hồ sơ điều chỉnh GPMT cho tạo hạt 2) — cần xác nhận. */
export const MACHINES: Record<MachineKey, { label: string; gpmt: string; stacks: string[]; confirmed: boolean }> = {
  TH1H: { label: "Máy 1", gpmt: "Tạo hạt 1", stacks: ["G02", "G03"], confirmed: false },
  TH2H: { label: "Máy 2", gpmt: "Tạo hạt 3 (dòng 06)", stacks: ["G06"], confirmed: true },
  TH3H: { label: "Máy 3", gpmt: "Tạo hạt 2", stacks: ["G04", "G05"], confirmed: false },
};
export const PROD_NOTES: string[] = ''' + json.dumps(d['notes'], ensure_ascii=False, indent=2) + ''';
export const PROD: Record<string, MonthData> = ''' + json.dumps(body, ensure_ascii=False, separators=(',', ':')) + ''' as any;
'''
open('src/data/production2026.ts', 'w').write(ts); print(len(ts) // 1024, 'KB')
