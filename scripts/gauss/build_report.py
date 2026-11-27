#!/usr/bin/env python3
"""Dựng báo cáo Word 'Đánh giá khả năng phát tán — lò hơi nguồn 01' từ gauss.json (scripts/gauss/run.ts).
Chạy: python3 scripts/gauss/build_report.py gauss.json out_dir"""
import json, sys, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
D = json.load(open(src))
B = {b["id"]: b for b in D["boilers"]}
LIM05 = D["meta"]["LIM05"]; LIM19 = D["meta"]["LIM19"]
NAME = {"tsp": "Bụi tổng (TSP)", "so2": "SO₂", "nox": "NO₂ (NOₓ)", "co": "CO"}
POL = ["tsp", "so2", "nox", "co"]
BG = {"tsp": (55, 178), "so2": (30, 136), "nox": (10, 70), "co": (743, 29780)}   # nền cấp tỉnh 2018–2025 (tham khảo, chưa có phiếu gốc)

def f(x, d=1):
    s = f"{x:,.{d}f}"
    return s.replace(",", "§").replace(".", ",").replace("§", ".")

# ── hình vẽ ──────────────────────────────────────────────────────────────
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 9})
col = {"LH01-A": "#2b8a3e", "LH01-B": "#8ccf7a", "LH02-A": "#c2410c", "LH02-B": "#f4a261"}
lab = {"LH01-A": "Lò sinh khối — thiết kế", "LH01-B": "Lò sinh khối — xả bằng giới hạn", "LH02-A": "Lò than — quan trắc 2026", "LH02-B": "Lò than — xả bằng giới hạn"}
fig, axs = plt.subplots(1, 2, figsize=(10, 3.8))
for ax, p, ttl in zip(axs, ["nox", "so2"], ["NO₂ (NOₓ)", "SO₂"]):
    for k, b in B.items():
        Q = (b["per"].get(p) or {}).get("Q")
        if not Q: continue
        ax.plot([q["x"] for q in b["prof"]], [q["cPerQ"] * Q for q in b["prof"]], color=col[k], lw=1.8, label=lab[k])
    ax.axhline(LIM05[p], color="#b91c1c", ls="--", lw=1); ax.text(2950, LIM05[p] * 1.04, f"QCVN 05:2023 (1 giờ) = {LIM05[p]} μg/m³", ha="right", va="bottom", color="#b91c1c", fontsize=8)
    ax.set_xlabel("Khoảng cách xuôi gió (m)"); ax.set_ylabel("Nồng độ 1 giờ ở độ cao 1,5 m (μg/m³)"); ax.set_title(f"{ttl} — trục gió, điều kiện bất lợi nhất"); ax.grid(alpha=.3); ax.set_xlim(0, 3000)
axs[0].legend(fontsize=7.5, loc="upper right")
plt.tight_layout(); plt.savefig(f"{out}/hinh1_nong_do_theo_khoang_cach.png", dpi=200); plt.close()

fig, ax = plt.subplots(figsize=(7.2, 3.6)); import numpy as np
stl = ["A", "B", "C", "D", "E", "F"]; w = 0.2
for i, k in enumerate(["LH01-A", "LH01-B", "LH02-A", "LH02-B"]):
    b = B[k]; Q = b["per"]["nox"]["Q"]; vals = [next(c for c in b["byClass"] if c["st"] == s)["cPerQ"] * Q for s in stl]
    ax.bar(np.arange(6) + (i - 1.5) * w, vals, w, color=col[k], label=lab[k])
ax.set_xticks(range(6)); ax.set_xticklabels([f"Lớp {s}" for s in stl]); ax.set_ylabel("NO₂ cực đại 1 giờ (μg/m³)"); ax.set_title("NO₂ cực đại theo lớp ổn định khí quyển (gió bất lợi nhất của mỗi lớp)")
ax.axhline(LIM05["nox"], color="#b91c1c", ls="--", lw=1); ax.legend(fontsize=7.5); ax.grid(axis="y", alpha=.3); plt.tight_layout(); plt.savefig(f"{out}/hinh2_nox_theo_lop_on_dinh.png", dpi=200); plt.close()

# ── Word ─────────────────────────────────────────────────────────────────
doc = Document()
sec = doc.sections[0]; sec.page_width, sec.page_height = Cm(21), Cm(29.7); sec.left_margin, sec.right_margin, sec.top_margin, sec.bottom_margin = Cm(3), Cm(2), Cm(2), Cm(2)
st = doc.styles["Normal"]; st.font.name = "Times New Roman"; st.font.size = Pt(13); st.element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
st.paragraph_format.space_after = Pt(4); st.paragraph_format.line_spacing = 1.15
for name, size in [("Heading 1", 14), ("Heading 2", 13), ("Heading 3", 13)]:
    h = doc.styles[name]; h.font.name = "Times New Roman"; h.font.size = Pt(size); h.font.bold = True; h.font.color.rgb = RGBColor(0, 0, 0)
    rf = h.element.rPr.rFonts
    for a in list(rf.attrib):
        if "Theme" in a: del rf.attrib[a]
    for a in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"): rf.set(qn(a), "Times New Roman")
    h.paragraph_format.space_before = Pt(10); h.paragraph_format.space_after = Pt(4); h.paragraph_format.keep_with_next = True
doc.styles["Heading 3"].font.italic = True

def para(t="", bold=False, italic=False, align=None, size=None, after=None):
    p = doc.add_paragraph(); r = p.add_run(t); r.bold = bold; r.italic = italic
    if size: r.font.size = Pt(size)
    if align == "c": p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "j": p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    if after is not None: p.paragraph_format.space_after = Pt(after)
    return p

def bullet(t):
    p = doc.add_paragraph(style="List Bullet"); p.add_run(t); p.paragraph_format.space_after = Pt(2); return p

def shade(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr(); sh = OxmlElement("w:shd"); sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), fill); tcPr.append(sh)

def table(rows, widths, header=True, size=10, align_num=True, bold_first_col=False):
    t = doc.add_table(rows=len(rows), cols=len(rows[0])); t.style = "Table Grid"; t.alignment = WD_TABLE_ALIGNMENT.CENTER; t.autofit = False
    for i, r in enumerate(rows):
        for j, v in enumerate(r):
            c = t.cell(i, j); c.width = Cm(widths[j]); c.text = ""
            p = c.paragraphs[0]; p.paragraph_format.space_after = Pt(0); p.paragraph_format.line_spacing = 1.0
            run = p.add_run(str(v)); run.font.size = Pt(size)
            if header and i == 0: run.bold = True; shade(c, "E7E6E6"); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            elif j > 0 and align_num: p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            if bold_first_col and j == 0 and i > 0: run.bold = True
    if header:
        trPr = t.rows[0]._tr.get_or_add_trPr(); th = OxmlElement("w:tblHeader"); th.set(qn("w:val"), "true"); trPr.append(th)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return t

def cap(t): p = para(t, bold=True, align="c", size=12, after=3); p.paragraph_format.keep_with_next = True; return p

# Trang tiêu đề
para("CÔNG TY CỔ PHẦN PHÂN BÓN BÌNH ĐIỀN", bold=True, align="c", after=0)
para("NHÀ MÁY PHÂN BÓN BÌNH ĐIỀN – LONG AN", bold=True, align="c", after=14)
para("PHỤ LỤC", bold=True, align="c", size=14, after=0)
para("ĐÁNH GIÁ KHẢ NĂNG PHÁT TÁN BỤI, KHÍ THẢI TỪ NGUỒN SỐ 01", bold=True, align="c", size=14, after=0)
para("(ống khói lò hơi cao 18 m, Ø700 mm) — MÔ HÌNH GAUSS", bold=True, align="c", size=14, after=0)
para("Lò hơi sinh khối 6 tấn hơi/giờ (vận hành chính, Thứ Hai – Thứ Sáu) và lò hơi than 8 tấn hơi/giờ (dự phòng, luân phiên Thứ Bảy – Chủ Nhật)", italic=True, align="c", after=10)
para("Kèm theo Báo cáo đề xuất điều chỉnh Giấy phép môi trường số 2986/GPMT-STNMT ngày 28/4/2023", align="c", after=2)
para("Tây Ninh, tháng 11 năm 2026", align="c", after=10)
para("Ghi chú nội bộ: số liệu đánh dấu (*) là ước tính hoặc giả định, cần xác nhận lại bằng số liệu thực đo trong giai đoạn vận hành thử nghiệm trước khi trình ký.", italic=True, size=11)

doc.add_heading("1. Mục đích, phạm vi và cơ sở", 1)
para("Phụ lục này đánh giá nồng độ bụi và khí thải ở mặt đất do nguồn số 01 gây ra, bằng mô hình phát tán Gauss nguồn điểm liên tục, cho hai chế độ vận hành luân phiên, không đồng thời, dùng chung một ống khói hiện hữu (cao 18 m, Ø700 mm, tọa độ X = 1172156; Y = 580206, VN2000, kinh tuyến trục 105°45', múi chiếu 3°):", align="j")
bullet("Chế độ 1 — lò hơi tầng sôi đốt sinh khối 6.000 kg hơi/giờ (lò chính), vận hành Thứ Hai – Thứ Sáu, khoảng 6.200 giờ/năm.")
bullet("Chế độ 2 — lò hơi đốt than hiện hữu 8 tấn hơi/giờ (dự phòng), vận hành luân phiên Thứ Bảy – Chủ Nhật hàng tuần (khoảng 96 ngày/năm, ≈ 26% thời gian) hoặc khi lò sinh khối sự cố; xử lý bằng lọc bụi ướt và hấp thụ dung dịch kiềm.")
para("Do hai lò không vận hành đồng thời nên không cộng gộp phát thải; mỗi chế độ được mô hình hóa riêng. Các nguồn khí thải khác của Nhà máy (lò sấy dây chuyền tạo hạt, phối trộn hữu cơ…) giữ nguyên theo Giấy phép môi trường hiện hành và không thuộc phạm vi phụ lục này.", align="j")
para("Cơ sở so sánh:", bold=True, after=2)
bullet("QCVN 19:2009/BTNMT, giá trị Cmax cột B, Kp = 0,8; Kv = 1,0 (nồng độ tại ống khói): bụi 160; SO₂ 400; NOₓ 680; CO 800 mg/Nm³ — theo Giấy phép môi trường số 2986/GPMT-STNMT.")
bullet("QCVN 05:2023/BTNMT, trung bình 1 giờ trong không khí xung quanh: TSP 300; SO₂ 350; NO₂ 200; CO 30.000 μg/m³ (đối chiếu bản gốc trước khi dùng cho hồ sơ).")
bullet("Số liệu nguồn: Báo cáo đề xuất điều chỉnh GPMT lò hơi sinh khối (Bảng 1.1, 1.3, 2.2), Phụ lục sửa đổi 20/11/2026, và phiếu kết quả quan trắc khí thải năm 2026 của Trung tâm Kỹ thuật Tài nguyên và Môi trường Tây Ninh (VILAS 269) — phiếu 0731/2026/DV, 1461/2026/DV.")

doc.add_heading("2. Thông số nguồn và tải lượng phát thải", 1)
cap("Bảng 1. Thông số ống khói và điều kiện khí thải")
rows = [["Thông số", "Lò sinh khối 6 t/h\n(thiết kế)", "Lò sinh khối 6 t/h\n(xả bằng giới hạn)", "Lò than 8 t/h\n(quan trắc 2026)", "Lò than 8 t/h\n(xả bằng giới hạn)"]]
ks = ["LH01-A", "LH01-B", "LH02-A", "LH02-B"]
rows += [["Chiều cao ống khói (m)"] + [f(B[k]["hs"], 0) for k in ks], ["Đường kính ống khói (m)"] + [f(B[k]["d"], 1) for k in ks],
         ["Nhiệt độ khí thải (°C)"] + [f(B[k]["tC"], 0) for k in ks], ["Lưu lượng thực (m³/h)"] + [f(B[k]["flowA"], 0) for k in ks],
         ["Lưu lượng chuẩn, 25 °C (Nm³/h)"] + [f(B[k]["flowN"], 0) for k in ks], ["Vận tốc ra ống khói (m/s)"] + [f(B[k]["vs"], 1) for k in ks]]
table(rows, [4.2, 2.9, 2.9, 2.9, 2.9], size=9.5)
para("Ghi chú: lò sinh khối (thiết kế): 7.000 Nm³/h ở 0 °C ≈ 11.400 m³/h ở 170 °C (Bảng 2.2 báo cáo); kịch bản xả bằng giới hạn lấy lưu lượng xả lớn nhất đã cấp phép 25.000 m³/h (quạt hút sinh khối 40.000 m³/h khống chế ≤ 25.000 m³/h bằng biến tần). Lò than: 19.636 m³/h, 86 °C theo phiếu 0731/2026/DV và 1461/2026/DV; quạt hút hiện hữu 25.000 m³/h.", italic=True, size=10.5, align="j")

cap("Bảng 2. Nồng độ tại ống khói và tải lượng phát thải dùng trong mô hình")
rows = [["Kịch bản", "Chất", "Nồng độ (mg/Nm³)", "Tải lượng (g/s)", "Tải lượng (kg/h)"]]
conc_note = {"LH01-A": "thiết kế", "LH01-B": "= QCVN 19", "LH02-A": "quan trắc 2026", "LH02-B": "= QCVN 19"}
for k in ks:
    b = B[k]
    for p in POL:
        pp = b["per"].get(p)
        if pp is None:
            rows.append([lab[k] if p == "tsp" else "", NAME[p], "chưa có số liệu (*)", "—", "—"]); continue
        c = pp["Q"] * 3.6e6 / b["flowN"] if k == "LH01-A" else b["conc"][p]
        rows.append([lab[k] if p == "tsp" else "", NAME[p], f(c, 1 if c < 100 else 0), f(pp["Q"], 4 if pp["Q"] < 0.1 else 3), f(pp["Q"] * 3.6, 3)])
table(rows, [4.6, 3.0, 3.0, 2.7, 2.7], size=9.5)
para("Lò sinh khối (thiết kế): tải lượng theo cân bằng chất — bụi từ cân bằng tro (tro 1%, tro bay 40%), hiệu suất cyclone chùm + túi vải ≥ 99% (sau xử lý ≈ 3,8 mg/Nm³); SO₂ theo cân bằng lưu huỳnh (S ≈ 0,02%); NOₓ theo nitơ nhiên liệu (hệ số chuyển hóa 25%) quy về NO₂. Nồng độ trong bảng quy về điều kiện chuẩn 25 °C, 1 atm của QCVN 19:2009 (báo cáo gốc quy về 0 °C: bụi 3,8; SO₂ 59,5; NOₓ 330 mg/Nm³, tương đương 3,5; 54,6; 304 mg/Nm³ ở 25 °C); tải lượng g/s không phụ thuộc cách quy đổi. CO của lò sinh khối chưa có số liệu nhà cung cấp nên chỉ được xét ở kịch bản xả bằng giới hạn.", italic=True, size=10.5, align="j")

doc.add_heading("3. Phương pháp mô hình hóa", 1)
para("Nồng độ chất ô nhiễm tại điểm nhận (x, y, z) được tính theo mô hình vệt khói Gauss nguồn điểm liên tục, có phản xạ ở mặt đất và giới hạn bởi lớp xáo trộn:", align="j")
para("C(x, y, z) = Q / (2π · u · σy · σz) · exp(−y² / 2σy²) · [exp(−(z − H)² / 2σz²) + exp(−(z + H)² / 2σz²)]", italic=True, align="c", size=12)
para("trong đó Q là tốc độ phát thải (g/s); u là vận tốc gió tại độ cao hiệu dụng của vệt khói (m/s); σy, σz là hệ số khuếch tán ngang và đứng (m); H = hs + Δh là độ cao hiệu dụng (m); hs là chiều cao ống khói và Δh là độ nâng của vệt khói.", align="j")
for t in ["σy, σz: công thức Pasquill–Gifford theo EPA ISC3 (Volume II), địa hình nông thôn (rural); sáu lớp ổn định khí quyển A–F.",
          "Gió: quy đổi từ độ cao 10 m lên độ cao ống khói bằng hàm mũ theo lớp ổn định (độ cao cơ sở nông thôn).",
          "Độ nâng vệt khói: công thức Briggs theo ISC3 (nâng do đẩy nổi và động lượng), có xét cuốn xuống đỉnh ống khói (stack-tip downwash); độ nâng cuối cùng.",
          "Lớp xáo trộn: chiều cao lớp xáo trộn theo SCREEN3 (EPA-454/B-95-004); khi vệt khói vượt lớp xáo trộn thì không xét đóng góp.",
          "Điều kiện khí tượng bất lợi nhất: quét toàn bộ 54 tổ hợp lớp ổn định × tốc độ gió 10 m hợp lệ theo bảng sàng lọc SCREEN3 (1 – 20 m/s tùy lớp); lấy tổ hợp cho nồng độ cực đại. Nhiệt độ không khí 30 °C; độ nhám bề mặt 0,3 m.",
          "Điểm nhận ở độ cao 1,5 m (vùng hô hấp); nồng độ trung bình 1 giờ, tính trên trục gió; không xét phân hủy hóa học, lắng khô hay ướt (bảo thủ).",
          "Do nồng độ tỷ lệ thuận với Q, mỗi tổ hợp khí tượng được tính một lần với Q = 1 g/s rồi nhân với tải lượng của từng chất."]:
    bullet(t)
para("Mô hình do Công ty tự lập trình trong hệ thống HSE Platform theo các công thức nêu trên (mã nguồn src/lib/gaussPlume.ts), đã được kiểm tra bằng bộ kiểm thử (đối chiếu đường cong σy, σz của Turner, độ nâng ISC3 và bảng tổ hợp sàng lọc SCREEN3); chưa so sánh trực tiếp với kết quả phần mềm AERMOD/SCREEN3; kết quả mang tính sàng lọc (screening), dùng để đánh giá sơ bộ và so sánh phương án.", align="j")

doc.add_heading("4. Kết quả mô hình", 1)
def res_rows(k, with_bg=True):
    b = B[k]; w = b["worst"]; rows = [["Chất", "Cmax mô hình (μg/m³)", "Giới hạn 1 giờ (μg/m³)", "% giới hạn", "Cộng nền thấp (μg/m³)", "Cộng nền cao (μg/m³)"]]
    for p in POL:
        pp = b["per"].get(p)
        if pp is None: rows.append([NAME[p], "chưa có số liệu (*)", f(LIM05[p], 0), "—", "—", "—"]); continue
        c = pp["cmax"]; lo, hi = BG[p]
        rows.append([NAME[p], f(c, 2 if c < 10 else 1), f(LIM05[p], 0), f(c / LIM05[p] * 100, 1) + " %", f(c + lo, 1), f(c + hi, 1) + (" (vượt)" if c + hi > LIM05[p] else "")])
    return rows, w
for num, (kk, title) in enumerate([("LH01-A", "4.1. Lò hơi sinh khối 6 t/h — số liệu thiết kế"), ("LH01-B", "4.2. Lò hơi sinh khối 6 t/h — giả thiết xả bằng giới hạn GPMT"), ("LH02-A", "4.3. Lò hơi than 8 t/h — kết quả quan trắc 2026"), ("LH02-B", "4.4. Lò hơi than 8 t/h — giả thiết xả bằng giới hạn GPMT")], 1):
    doc.add_heading(title, 2)
    rows, w = res_rows(kk)
    para(f"Điều kiện bất lợi nhất: lớp ổn định {w['st']}, gió 10 m = {f(w['u10'],1)} m/s; cực đại xảy ra cách ống khói khoảng {f(w['x'],0)} m; độ cao hiệu dụng H ≈ {f(w['H'],0)} m; vận tốc ra ống khói {f(B[kk]['vs'],1)} m/s.", align="j")
    cap(f"Bảng {2 + num}. Nồng độ cực đại 1 giờ ở mặt đất — {lab[kk]}")
    table(rows, [3.0, 2.6, 2.5, 2.0, 2.4, 2.6], size=9.5)
para("Nền thấp/cao: khoảng giá trị quan trắc không khí tổng quan tỉnh Tây Ninh giai đoạn 2018–2025 (TSP 55–178; SO₂ 30–136; NO₂ 10–70; CO 743–29.780 μg/m³) — số liệu tham khảo, chưa có phiếu kết quả gốc, giá trị cận trên của CO đáng ngờ; nồng độ nền cần thay bằng kết quả quan trắc không khí xung quanh của Nhà máy khi hoàn thiện hồ sơ.", italic=True, size=10.5, align="j")

doc.add_heading("4.5. Phân bố theo khoảng cách", 2)
dists = [100, 200, 300, 500, 1000, 2000]
cap("Bảng 7. Nồng độ cực đại 1 giờ theo khoảng cách (mọi tổ hợp khí tượng) — kịch bản số liệu thiết kế/quan trắc")
rows = [["Khoảng cách (m)"] + [f"{NAME[p]} — sinh khối" for p in ["tsp", "so2", "nox"]] + [f"{NAME[p]} — than" for p in ["tsp", "so2", "nox"]]]
for x in dists:
    r = [f(x, 0)]
    for k in ["LH01-A", "LH02-A"]:
        a = next(q for q in B[k]["atDist"] if q["x"] == x)
        for p in ["tsp", "so2", "nox"]:
            r.append(f(a["cPerQ"] * B[k]["per"][p]["Q"], 2))
    rows.append(r)
table(rows, [2.2, 2.2, 2.2, 2.2, 2.2, 2.2, 2.2], size=9)
para("Đơn vị μg/m³. Ba cột đầu: lò sinh khối (thiết kế); ba cột sau: lò than (quan trắc 2026). Khoảng cách tới khu dân cư gần nhất cần bổ sung để đối chiếu trực tiếp (hiện chưa có trong hồ sơ).", italic=True, size=10.5, align="j")
doc.add_picture(f"{out}/hinh1_nong_do_theo_khoang_cach.png", width=Cm(15.8)); doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
cap("Hình 1. Nồng độ NO₂ và SO₂ theo khoảng cách xuôi gió ở điều kiện khí tượng bất lợi nhất")
doc.add_picture(f"{out}/hinh2_nox_theo_lop_on_dinh.png", width=Cm(13.5)); doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
cap("Hình 2. NO₂ cực đại theo lớp ổn định khí quyển")

doc.add_heading("5. Nhận xét và kết luận", 1)
a1, a2, b1, b2 = B["LH01-A"], B["LH02-A"], B["LH01-B"], B["LH02-B"]
pct = lambda b, p: b["per"][p]["cmax"] / LIM05[p] * 100
for t in [
    f"Lò hơi sinh khối (chế độ chính, số liệu thiết kế): nồng độ cực đại 1 giờ ở mặt đất của bụi {f(a1['per']['tsp']['cmax'],2)}, SO₂ {f(a1['per']['so2']['cmax'],1)} và NO₂ {f(a1['per']['nox']['cmax'],1)} μg/m³, tương ứng {f(pct(a1,'tsp'),1)}%, {f(pct(a1,'so2'),1)}% và {f(pct(a1,'nox'),1)}% giới hạn QCVN 05:2023, xảy ra cách ống khói khoảng {f(a1['worst']['x'],0)} m (lớp C, gió 2,5 m/s).",
    f"Lò hơi than (chế độ dự phòng, kết quả quan trắc 2026): bụi {f(a2['per']['tsp']['cmax'],1)}, SO₂ {f(a2['per']['so2']['cmax'],1)}, NO₂ {f(a2['per']['nox']['cmax'],1)}, CO {f(a2['per']['co']['cmax'],1)} μg/m³ — tương ứng {f(pct(a2,'tsp'),1)}%, {f(pct(a2,'so2'),1)}%, {f(pct(a2,'nox'),1)}% và {f(pct(a2,'co'),2)}% giới hạn 1 giờ.",
    f"Ngay cả khi giả thiết khí thải xả đúng bằng giới hạn QCVN 19:2009 (Kp = 0,8) ở lưu lượng lớn nhất cấp phép, đóng góp riêng của nguồn 01 vẫn thấp hơn giới hạn QCVN 05:2023: lò sinh khối — NO₂ {f(b1['per']['nox']['cmax'],1)} μg/m³ ({f(pct(b1,'nox'),0)}%); lò than — NO₂ {f(b2['per']['nox']['cmax'],1)} μg/m³ ({f(pct(b2,'nox'),0)}%), SO₂ {f(b2['per']['so2']['cmax'],1)} μg/m³ ({f(pct(b2,'so2'),0)}%). Đây là mức trần giả định; nồng độ thực đo thấp hơn nhiều (NOₓ thực đo 28 – 34 mg/Nm³ so với giới hạn 680 mg/Nm³).",
    f"Khi cộng nồng độ nền cấp tỉnh ở cận trên (NO₂ 70 μg/m³), kịch bản lò than xả bằng giới hạn cho tổng NO₂ {f(b2['per']['nox']['cmax']+70,0)} μg/m³, vượt giới hạn 200 μg/m³; các kịch bản còn lại đều đạt kể cả khi cộng nền cận trên. Do nồng độ nền tham khảo chưa có phiếu gốc, kết luận này cần được xác nhận khi có kết quả quan trắc không khí xung quanh của Nhà máy.",
    "Hai chế độ vận hành không đồng thời nên không cộng dồn; lò sinh khối có tải lượng SO₂ và bụi thấp hơn lò than, và nồng độ cực đại mô hình ở chế độ thiết kế chủ yếu do NOₓ (nitơ nhiên liệu).",
    "Kết luận: với số liệu hiện có, việc vận hành luân phiên lò hơi sinh khối (chính) và lò hơi than (dự phòng) qua ống khói hiện hữu cao 18 m không làm nồng độ bụi, SO₂, NO₂, CO ở mặt đất vượt QCVN 05:2023/BTNMT do đóng góp riêng của nguồn 01."]:
    bullet(t)

doc.add_heading("6. Hạn chế và kiến nghị", 1)
for t in ["Mô hình sàng lọc cho địa hình bằng phẳng và nguồn liên tục; chưa xét cuốn xuống do nhà xưởng (cần chiều cao và bề rộng công trình cạnh ống khói để kiểm tra chiều cao GEP), chưa xét địa hình và chế độ gió nhiều năm. Khi cần độ chính xác cao hơn nên chạy AERMOD với số liệu khí tượng bề mặt và thượng không tại trạm đại diện của Tây Ninh.",
          "CO của lò sinh khối chưa có số liệu thiết kế (*); cần số liệu bảo đảm của nhà cung cấp và kiểm chứng trong giai đoạn vận hành thử nghiệm.",
          "Các giá trị (*) trong báo cáo gốc (than 1.225 tấn/năm, NaOH 86 kg/tháng…) là ước tính theo tỷ lệ ngày vận hành; mô hình này không phụ thuộc các giá trị đó nhưng chịu ảnh hưởng của nồng độ khí thải thực tế.",
          "Kiến nghị lấy mẫu khí thải trong vận hành thử nghiệm cho cả hai chế độ (≥ 03 mẫu đơn trong 03 ngày liên tiếp khi lò sinh khối chạy; ≥ 01 đợt khi lò than chạy cuối tuần) và dùng kết quả đó cập nhật lại mô hình này.",
          "Bổ sung quan trắc không khí xung quanh (TSP, SO₂, NO₂, CO, NH₃) tại ít nhất 02 vị trí (đầu và cuối hướng gió chủ đạo, gần khu dân cư gần nhất) làm nồng độ nền cho lần đánh giá chính thức."]:
    bullet(t)

doc.add_heading("Phụ lục A. Cực đại theo lớp ổn định khí quyển", 1)
rows = [["Lớp ổn định", "Gió 10 m bất lợi (m/s)", "x tại cực đại (m)", "H (m)", "NO₂ — sinh khối thiết kế (μg/m³)", "NO₂ — than quan trắc (μg/m³)", "SO₂ — than quan trắc (μg/m³)"]]
for s in stl:
    ca = next(c for c in a1["byClass"] if c["st"] == s); cb = next(c for c in a2["byClass"] if c["st"] == s)
    rows.append([s, f(ca["u10"], 1), f(ca["x"], 0), f(ca["H"], 0), f(ca["cPerQ"] * a1["per"]["nox"]["Q"], 2), f(cb["cPerQ"] * a2["per"]["nox"]["Q"], 2), f(cb["cPerQ"] * a2["per"]["so2"]["Q"], 2)])
cap("Bảng A1. Nồng độ cực đại theo lớp ổn định")
table(rows, [1.8, 2.4, 2.2, 1.5, 2.9, 2.8, 2.8], size=9)
para("Hệ tọa độ, thông số mô hình và mã nguồn: HSE Platform — src/lib/gaussPlume.ts; kịch bản tính: scripts/gauss/run.ts.", italic=True, size=10.5)

# số trang ở chân trang
fp = sec.footer.paragraphs[0]; fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = fp.add_run(); r.font.size = Pt(10)
for tag, txt in [("begin", None), (None, "PAGE"), ("end", None)]:
    if tag: e = OxmlElement("w:fldChar"); e.set(qn("w:fldCharType"), tag); r._r.append(e)
    else: e = OxmlElement("w:instrText"); e.set(qn("xml:space"), "preserve"); e.text = txt; r._r.append(e)
doc.save(f"{out}/Phu-luc-Gauss-lo-hoi-nguon-01.docx")
print("ok")
