#!/usr/bin/env python3
"""Bảng tính tổng tải lượng và mô hình Gauss toàn nhà máy (nội bộ, không đưa vào báo cáo) từ gauss.json (scripts/gauss/run.ts).
Chạy: python3 scripts/gauss/build_workbook.py gauss.json out.xlsx"""
import json, sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter as L

D = json.load(open(sys.argv[1])); OUT = sys.argv[2]
P = ["tsp", "so2", "nox", "co", "nh3"]; PN = {"tsp": "Bụi TSP", "so2": "SO₂", "nox": "NO₂ (NOₓ)", "co": "CO", "nh3": "NH₃"}
LIM19 = D["meta"]["LIM19"]; LIM05 = D["meta"]["LIM05"]
wb = Workbook()
H = Font(bold=True, color="FFFFFF"); HF = PatternFill("solid", fgColor="1F4E78"); INP = Font(color="0000FF"); ASSUME = PatternFill("solid", fgColor="FFF2CC"); WARN = PatternFill("solid", fgColor="FCE4D6")
thin = Side(style="thin", color="BBBBBB"); BR = Border(left=thin, right=thin, top=thin, bottom=thin)
def hdr(ws, row, vals, widths=None):
    for j, v in enumerate(vals, 1):
        c = ws.cell(row, j, v); c.font = H; c.fill = HF; c.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center"); c.border = BR
    ws.row_dimensions[row].height = 42
    if widths:
        for j, w in enumerate(widths, 1): ws.column_dimensions[L(j)].width = w
def put(ws, r, c, v, fmt=None, inp=False, fill=None, bold=False, wrap=False):
    cell = ws.cell(r, c, v); cell.border = BR
    if fmt: cell.number_format = fmt
    if inp: cell.font = INP
    if bold: cell.font = Font(bold=True, color="0000FF" if inp else "000000")
    if fill: cell.fill = fill
    if wrap: cell.alignment = Alignment(wrap_text=True, vertical="top")
    return cell

# ─── Nguồn ───────────────────────────────────────────────────────────────
S = wb.active; S.title = "Nguồn"
S["A1"] = "Nguồn khí thải của Nhà máy (GPMT 2986/GPMT-STNMT, Phụ lục 2) — thông số đầu vào"; S["A1"].font = Font(bold=True, size=13)
S["A2"] = "Chữ xanh = số liệu nhập; ô vàng = giả định cần xác nhận. Kịch bản A = quan trắc/thiết kế thực tế; B = xả bằng giới hạn GPMT ở lưu lượng thiết kế (mức trần giả định)."
cols = ["Mã", "Nguồn", "Cao (m)", "Đường kính (m)", "X VN2000", "Y VN2000", "x Đông so với S01 (m)", "z Nam so với S01 (m)", "Nhiệt độ (°C)", "Lưu lượng thực A (m³/h)", "Lưu lượng thiết kế B (m³/h)", "Giờ chạy/năm"] \
       + [f"A: {PN[p]} (mg/Nm³)" for p in P] + [f"B: {PN[p]} (mg/Nm³)" for p in P] + ["Ghi chú"]
hdr(S, 4, cols, [10, 38, 8, 10, 11, 11, 11, 11, 9, 13, 13, 10] + [10] * 10 + [60])
sc0 = {s["id"]: s for s in D["plant"]["scenarios"][0]["sources"]}   # ngày thường A
sc1 = {s["id"]: s for s in D["plant"]["scenarios"][1]["sources"]}   # cuối tuần A
scB0 = {s["id"]: s for s in D["plant"]["scenarios"][2]["sources"]}  # ngày thường B
scB1 = {s["id"]: s for s in D["plant"]["scenarios"][3]["sources"]}
Bo = {b["id"]: b for b in D["boilers"]}
def conc_of(s, p, flowN=None):   # nồng độ (mg/Nm³ ở 25 °C) từ tải lượng
    return s["Q"].get(p, 0) * 3.6e6 / s["flowN"] if s["flowN"] else 0
rows = []
bk = Bo["LH01-A"]; bt = Bo["LH02-A"]
rows.append(("S01-SK", "S01 — Lò hơi sinh khối 6 t/h (chính, T2–T6)", 18, 0.7, 1172156, 580206, 0, 0, 170, 11400, 25000, 6200, [conc_of(sc0["S01"], p) for p in P], [Bo["LH01-B"]["conc"].get(p, 0) for p in P], "A: tải lượng theo cân bằng chất (Bảng 2.2); nồng độ quy về 25 °C; CO chưa có số liệu. B: xả bằng QCVN 19 cột B (Kp 0,8)."))
rows.append(("S01-THAN", "S01 — Lò hơi than 8 t/h (dự phòng, T7–CN)", 18, 0.7, 1172156, 580206, 0, 0, 86, 19636, 25000, 2304, [bt["conc"].get(p, 0) for p in P], [Bo["LH02-B"]["conc"].get(p, 0) for p in P], "A: giá trị lớn nhất 2 đợt quan trắc 2026 (phiếu 0731, 1461). Giờ chạy: 96 ngày × 24 h."))
meta = {"S02": ("Lò sấy nóng · tạo hạt 1", 55000), "S03": ("Lò sấy nguội · tạo hạt 1", 55000), "S04": ("Lò sấy nóng · tạo hạt 2 (nguồn 04)", 55000), "S05": ("Lò sấy nguội · tạo hạt 2", 55000), "S06": ("Lò sấy · tạo hạt 3", 140000), "S07": ("Phối trộn phân hữu cơ", 10000)}
for sid, (nm, fdes) in meta.items():
    a = next(s for s in D["plant"]["actualSources"] if s["id"] == sid); lm = next(s for s in D["plant"]["limitSources"] if s["id"] == sid)
    run = sid != "S07"
    rows.append((sid, nm, a["hs"], a["d"], a["xy"][0], a["xy"][1], a["xy"][1] - 580206, -(a["xy"][0] - 1172156), a["tC"], a["flowA"] if run else 0, fdes if run else 0, 6000 if run else 0,
                 [a["c"].get(p, 0) for p in P], [lm["c"].get(p, 0) for p in P], a["note"] + ("; <10 lấy 10 (LOD); giờ chạy/năm là giả định" if run else "; không vận hành nên không tính phát thải")))
rows.append(("S08", "Máy phát điện dự phòng", None, None, 1172298, 580288, 580288 - 580206, -(1172298 - 1172156), None, 0, 0, 0, [0] * 5, [0] * 5, "Chưa có thông số ống thải; chạy ngắt quãng — không đưa vào mô hình."))
for i, r in enumerate(rows):
    rr = 5 + i
    for j, v in enumerate(r[:12], 1):
        put(S, rr, j, v, fmt="#,##0.0" if j in (3, 4, 9) else ("#,##0" if j >= 5 else None), inp=j >= 3)
    for k in range(5): put(S, rr, 13 + k, r[12][k], fmt="0.00", inp=True); put(S, rr, 18 + k, r[13][k], fmt="0.0", inp=True)
    put(S, rr, 23, r[14], wrap=True)
    if r[0] in ("S02", "S03", "S04", "S05", "S06"): S.cell(rr, 12).fill = ASSUME
S.freeze_panes = "C5"
NSRC = len(rows)

# ─── Tải lượng ────────────────────────────────────────────────────────────
T = wb.create_sheet("Tải lượng")
T["A1"] = "Tổng tải lượng phát thải — tính từ nồng độ × lưu lượng chuẩn (25 °C, 1 atm; QCVN 19:2009)"; T["A1"].font = Font(bold=True, size=13)
T["A2"] = "Q (g/s) = C (mg/Nm³) × lưu lượng chuẩn (Nm³/h) / 3.600.000; lưu lượng chuẩn = lưu lượng thực × 298,15 / (273,15 + T). Tấn/năm = kg/h × giờ chạy / 1000."
heads = ["Mã", "Nguồn", "Lưu lượng chuẩn (Nm³/h)", "Vận tốc ra ống (m/s)"] + [f"{PN[p]} (g/s)" for p in P] + [f"{PN[p]} (kg/h)" for p in P] + [f"{PN[p]} (t/năm)" for p in P]
WID = [10, 38, 14, 11] + [10] * 15
rowmap = {}
def block(top, tag, flowcol, conc0, title, annual):
    T.cell(top - 1, 1, title).font = Font(bold=True, size=12)
    hdr(T, top, heads, WID)
    for i, r in enumerate(rows[:-1]):
        rr = top + 1 + i; sr = 5 + i; rowmap[(tag, r[0])] = rr
        put(T, rr, 1, f"=Nguồn!A{sr}"); put(T, rr, 2, f"=Nguồn!B{sr}")
        put(T, rr, 3, f"=IF(Nguồn!{flowcol}{sr}=0,0,Nguồn!{flowcol}{sr}*298.15/(273.15+Nguồn!I{sr}))", "#,##0")
        put(T, rr, 4, f"=IF(Nguồn!{flowcol}{sr}=0,0,Nguồn!{flowcol}{sr}/3600/(PI()*Nguồn!D{sr}^2/4))", "0.0")
        for k in range(5):
            cc = L(conc0 + k)
            put(T, rr, 5 + k, f"=Nguồn!{cc}{sr}*C{rr}/3600000", "0.0000")
            put(T, rr, 10 + k, f"={L(5 + k)}{rr}*3.6", "0.000")
            put(T, rr, 15 + k, f"={L(10 + k)}{rr}*Nguồn!L{sr}/1000" if annual else None, "0.00")
    n = len(rows) - 1; a, b = top + 1, top + n
    # tổng ngày thường: S01-SK + S02..S07 ; cuối tuần: S01-THAN + S02..S07
    for lab, first, off in [("TỔNG — ngày thường (lò sinh khối + các lò sấy)", a, 0), ("TỔNG — cuối tuần (lò than + các lò sấy)", a + 1, 1)]:
        rr = top + n + 1 + off
        put(T, rr, 2, lab, bold=True); T.cell(rr, 2).fill = ASSUME if False else PatternFill("solid", fgColor="DDEBF7")
        for k in range(10):
            col = L(5 + k)
            if off == 0: f = f"=SUM({col}{a}:{col}{a})+SUM({col}{a + 2}:{col}{b})"
            else: f = f"=SUM({col}{a + 1}:{col}{b})"
            put(T, rr, 5 + k, f, "0.0000" if k < 5 else "0.000").font = Font(bold=True)
    if annual:
        rr = top + n + 3; put(T, rr, 2, "TỔNG CẢ NĂM (tấn/năm) — theo giờ chạy ở sheet Nguồn", bold=True); T.cell(rr, 2).fill = PatternFill("solid", fgColor="DDEBF7")
        for k in range(5): put(T, rr, 15 + k, f"=SUM({L(15 + k)}{a}:{L(15 + k)}{b})", "0.00").font = Font(bold=True)
    return top + n + 4
nxt = block(5, "A", "J", 13, "A. Quan trắc / thiết kế thực tế", True)
block(nxt + 3, "B", "K", 18, "B. Xả bằng giới hạn GPMT ở lưu lượng thiết kế (mức trần giả định — không phải số liệu vận hành)", False)
T.freeze_panes = "C6"

# ─── Gauss từng nguồn ─────────────────────────────────────────────────────
G = wb.create_sheet("Gauss từng nguồn")
G["A1"] = "Mô hình Gauss — từng nguồn riêng lẻ (sàng lọc SCREEN3 51 tổ hợp, ISC3, nông thôn, z = 1,5 m, TB 1 giờ)"; G["A1"].font = Font(bold=True, size=13)
G["A2"] = "Cmax = Q (g/s) × hệ số C/Q (μg/m³ trên g/s, từ mô hình). Q lấy từ sheet Tải lượng."
hdr(G, 4, ["Kịch bản", "Mã", "Nguồn", "Lớp ổn định", "Gió 10 m (m/s)", "x tại cực đại (m)", "C/Q (μg/m³ trên g/s)"] + [f"Cmax {PN[p]} (μg/m³)" for p in P] + [f"% QCVN 05 {PN[p]}" for p in P],
    [26, 10, 38, 9, 10, 11, 12] + [11] * 10)
rr = 5
tagmap = {"A_ngay_thuong": "A", "A_cuoi_tuan": "A", "B_ngay_thuong": "B", "B_cuoi_tuan": "B"}
for sc in D["plant"]["scenarios"]:
    tag = tagmap[sc["key"]]
    for s in sc["sources"]:
        sid = s["id"]
        key = ("S01-SK" if "ngay_thuong" in sc["key"] else "S01-THAN") if sid == "S01" else sid
        t = rowmap[(tag, key)]
        put(G, rr, 1, sc["label"][:60]); put(G, rr, 2, sid); put(G, rr, 3, s["name"])
        put(G, rr, 4, s["single"]["st"]); put(G, rr, 5, s["single"]["u10"], "0.0"); put(G, rr, 6, s["single"]["x"], "#,##0"); put(G, rr, 7, s["single"]["cPerQ"], "0.000")
        for k, p in enumerate(P):
            put(G, rr, 8 + k, f"='Tải lượng'!{L(5 + k)}{t}*G{rr}", "0.00")
            put(G, rr, 13 + k, f"=IF({LIM05[p]}=0,\"\",{L(8 + k)}{rr}/{LIM05[p]})", "0.0%")
        rr += 1
G.freeze_panes = "D5"

# ─── Tổng hợp nhà máy ─────────────────────────────────────────────────────
C = wb.create_sheet("Tổng hợp nhà máy")
C["A1"] = "Mô hình Gauss tổng hợp — cộng gộp các ống khói đồng thời, quét 4 lớp-gió × 24 hướng gió (15°); lưới 81×81 ô, ±1.500 m quanh S01"; C["A1"].font = Font(bold=True, size=13)
C["A2"] = "Tọa độ điểm cực đại: x Đông, z Nam so với ống khói S01. Hướng gió = hướng gió THỔI TỪ (độ, 0 = Bắc, 90 = Đông). Giới hạn: QCVN 05:2023 (TB 1 giờ). Không cộng nồng độ nền."
hdr(C, 4, ["Kịch bản", "Chất", "Cmax tổng (μg/m³)", "Giới hạn 1 giờ (μg/m³)", "% giới hạn", "Đánh giá", "x (m)", "z (m)", "Lớp ổn định", "Gió 10 m (m/s)", "Hướng gió từ (°)", "S01", "S02", "S03", "S04", "S05", "S06", "Nguồn đóng góp lớn nhất"],
    [48, 11, 13, 13, 10, 11, 8, 8, 9, 9, 10, 9, 9, 9, 9, 9, 9, 22])
rr = 5
for sc in D["plant"]["scenarios"]:
    for p in P:
        b = sc["best"][p]; contrib = b.get("contrib", {})
        put(C, rr, 1, sc["label"], wrap=True); put(C, rr, 2, PN[p]); put(C, rr, 3, b["c"], "0.0"); put(C, rr, 4, LIM05[p], "#,##0")
        put(C, rr, 5, f"=C{rr}/D{rr}", "0.0%"); put(C, rr, 6, f"=IF(E{rr}>1,\"VƯỢT\",\"Đạt\")")
        put(C, rr, 7, b.get("x", 0), "#,##0"); put(C, rr, 8, b.get("z", 0), "#,##0"); put(C, rr, 9, b.get("st", "")); put(C, rr, 10, b.get("u10", ""), "0.0"); put(C, rr, 11, b.get("dirFrom", ""), "0")
        for k, sid in enumerate(["S01", "S02", "S03", "S04", "S05", "S06"]): put(C, rr, 12 + k, contrib.get(sid, 0), "0.0")
        top = max(contrib, key=lambda k: contrib[k]) if contrib else ""
        put(C, rr, 18, f'=INDEX($L$4:$Q$4,MATCH(MAX(L{rr}:Q{rr}),L{rr}:Q{rr},0))')
        if sc["kind"] == "limit": C.cell(rr, 1).fill = WARN
        rr += 1
C.freeze_panes = "C5"
rr += 1
C.cell(rr, 1, "Ghi chú: kịch bản B (xả bằng giới hạn) là mức trần giả định, không phải số liệu vận hành; các giá trị 'VƯỢT' ở kịch bản B cho thấy giới hạn QCVN 19 ở lưu lượng thiết kế của toàn bộ các lò sấy chạy đồng thời sẽ không bảo đảm QCVN 05 nếu nồng độ thực tế tiến gần giới hạn — thực đo 2026 thấp hơn giới hạn 10 – 50 lần.").alignment = Alignment(wrap_text=True)
C.merge_cells(start_row=rr, start_column=1, end_row=rr, end_column=11); C.row_dimensions[rr].height = 48

# ─── Độ nhạy & cảnh báo ───────────────────────────────────────────────────
N = wb.create_sheet("Độ nhạy & ghi chú")
s7 = D["plant"]["S07_if_running"]
lines = [
    ("Độ nhạy 1 — dây chuyền phối trộn hữu cơ (S07) nếu vận hành", None),
    (f"Ống thải cao 1,2 m, Ø300 mm, 10.000 m³/h (vận tốc {s7['vs']:.1f} m/s), bụi bằng giới hạn QCVN 21 (200 mg/Nm³): Q = {s7['Q_tsp']:.3f} g/s → bụi cực đại 1 giờ ≈ {s7['cmax']:.0f} μg/m³ cách ống {s7['x']:.0f} m (lớp {s7['st']}, gió {s7['u10']} m/s) — vượt 300 μg/m³ (QCVN 05:2023) nếu xả bằng giới hạn. Hiện không vận hành nên không đưa vào tổng hợp; cần kiểm tra chiều cao ống thải (1,2 m) và hiệu suất túi vải khi chạy lại.", None),
    ("", None), ("Giả định và hạn chế", None),
    ("1. Vị trí ống khói theo tọa độ VN2000 trong GPMT 2986 (X, Y); x Đông = ΔY, z Nam = −ΔX so với S01.", None),
    ("2. Ống khói S02–S05: D2 = 600 mm theo GPMT hiện hành → vận tốc ra ống 40–50 m/s (cao bất thường, có thể làm mô hình đánh giá thấp nồng độ do nâng vệt khói lớn). Hồ sơ đề nghị điều chỉnh 10/11/2026 đề nghị D2 = 1.500 mm cho nguồn 04 (chưa cấp phép).", None),
    ("3. Giờ chạy/năm của các lò sấy là giả định (6.000 h) — thay bằng số giờ thực ở sheet Nguồn (ô vàng).", None),
    ("4. Lò sấy: lưu lượng thực = giá trị lớn nhất đo năm 2026; nồng độ '<10' lấy bằng 10 (LOD); NH₃ KPH lấy theo LOD lớn nhất.", None),
    ("5. Dòng thải 06 (tạo hạt 3): thiết kế 140.000 m³/h (đã xác nhận), lưu lượng đo 2026 chỉ ≈ 79.000 m³/h.", None),
    ("6. Mô hình sàng lọc: địa hình bằng phẳng, nguồn liên tục, không xét cuốn xuống do nhà xưởng, không xét phân hủy/lắng; khí tượng: 4 tốc độ gió (1–5 m/s) × 6 lớp ổn định × 24 hướng gió.", None),
    ("7. Không cộng nồng độ nền; nguồn thấp (đường, kho, bốc dỡ) không có trong bảng tính này.", None),
    ("8. Máy phát điện dự phòng (nguồn 08) chưa có thông số ống thải — không đưa vào.", None),
    ("", None), ("Nguồn số liệu", None),
    ("GPMT 2986/GPMT-STNMT (28/04/2023), Phụ lục 2; Báo cáo đề xuất điều chỉnh GPMT lò hơi sinh khối và Phụ lục sửa đổi 20/11/2026; phiếu quan trắc khí thải 2026 (TTKTTN&MT Tây Ninh): 0331, 0424, 0731, 1461, 1537, 1662/2026/DV; Hồ sơ điều chỉnh GPMT nguồn 04 (10/11/2026).", None),
    ("Mã nguồn tính: scripts/gauss/run.ts (HSE Platform, src/lib/gaussPlume.ts).", None),
]
N.column_dimensions["A"].width = 150
for i, (t, _) in enumerate(lines, 1):
    c = N.cell(i, 1, t); c.alignment = Alignment(wrap_text=True, vertical="top")
    if t and (t[0] in "ĐGN" and len(t) < 70): c.font = Font(bold=True)
N.cell(2, 1).fill = WARN
wb.move_sheet("Độ nhạy & ghi chú", offset=0)
wb.save(OUT); print("ok", OUT)
