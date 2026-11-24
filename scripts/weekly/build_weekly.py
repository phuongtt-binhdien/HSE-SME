#!/usr/bin/env python3
"""Báo cáo HSE nội bộ hằng tuần — NM Phân bón Bình Điền – Long An.
Dùng: python3 scripts/weekly/build_weekly.py [YYYY-MM-DD] [--out file.docx]
Ngày bất kỳ trong tuần cần lập (mặc định hôm nay). Các ô số liệu hiện trường để trống — không điền số bịa."""
import sys, datetime as dt
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

args = [a for a in sys.argv[1:] if not a.startswith("--")]
out = None
if "--out" in sys.argv: out = sys.argv[sys.argv.index("--out") + 1]; args = [a for a in args if a != out]
day = dt.date.fromisoformat(args[0]) if args else dt.date.today()
mon = day - dt.timedelta(days=day.weekday()); sun = mon + dt.timedelta(days=6)
nxt = mon + dt.timedelta(days=7); nsun = nxt + dt.timedelta(days=6)
wk = mon.isocalendar()[1]
f = lambda d: d.strftime("%d/%m/%Y")
out = out or f"docs/bao-cao-tuan/BC_HSE_Tuan_{wk:02d}_{mon.year}_BinhDien_LongAn.docx"

doc = Document()
s = doc.sections[0]; s.page_width, s.page_height = Cm(21), Cm(29.7)
s.left_margin, s.right_margin, s.top_margin, s.bottom_margin = Cm(2.5), Cm(2), Cm(2), Cm(2)
st = doc.styles["Normal"]; st.font.name = "Times New Roman"; st.font.size = Pt(13)
st.element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman"); st.paragraph_format.space_after = Pt(4)

def P(text="", bold=False, italic=False, align=None, size=None, color=None, after=None):
    p = doc.add_paragraph(); r = p.add_run(text); r.bold = bold; r.italic = italic
    if size: r.font.size = Pt(size)
    if color: r.font.color.rgb = RGBColor(*color)
    if align == "c": p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if after is not None: p.paragraph_format.space_after = Pt(after)
    return p
def H(text): p = P(text, bold=True, after=3); p.paragraph_format.space_before = Pt(8); p.paragraph_format.keep_with_next = True; return p
def shade(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr(); sh = OxmlElement("w:shd"); sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), fill); tcPr.append(sh)
def T(head, rows, widths=None, size=11, blank_rows=0):
    t = doc.add_table(rows=1, cols=len(head)); t.style = "Table Grid"; t.autofit = False
    for i, h in enumerate(head):
        c = t.rows[0].cells[i]; c.text = ""; r = c.paragraphs[0].add_run(h); r.bold = True; r.font.size = Pt(size); shade(c, "D9E2F3")
    for row in list(rows) + [[""] * len(head)] * blank_rows:
        cells = t.add_row().cells
        for i, v in enumerate(row):
            cells[i].text = ""; r = cells[i].paragraphs[0].add_run(str(v)); r.font.size = Pt(size)
    if widths:
        for row in t.rows:
            for i, w in enumerate(widths): row.cells[i].width = Cm(w)
    for row in t.rows:
        for c in row.cells: c.paragraphs[0].paragraph_format.space_after = Pt(1)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return t

# ---- Tiêu đề
t = doc.add_table(rows=1, cols=2); t.autofit = False
a, b = t.rows[0].cells; a.width = Cm(7.5); b.width = Cm(9)
a.text = ""; r = a.paragraphs[0].add_run("CÔNG TY CP PHÂN BÓN BÌNH ĐIỀN\nNHÀ MÁY PHÂN BÓN BÌNH ĐIỀN – LONG AN\nPHÒNG KỸ THUẬT SẢN XUẤT"); r.bold = True; r.font.size = Pt(11); a.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
b.text = ""; r = b.paragraphs[0].add_run("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập – Tự do – Hạnh phúc"); r.bold = True; r.font.size = Pt(11); b.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
P("")
P("BÁO CÁO HSE NỘI BỘ HẰNG TUẦN", bold=True, align="c", size=15, after=0)
P(f"Tuần {wk}/{mon.year} (từ {f(mon)} đến {f(sun)})", align="c", after=0)
P("Môi trường – An toàn – PCCC – Sức khỏe nghề nghiệp", italic=True, align="c")
P("Kính gửi: Ban Giám đốc nhà máy; Trưởng phòng KT-SX", after=0)
P(f"Người lập: Trình Thiên Phương – cán bộ phụ trách môi trường. Ngày lập: …/…/{mon.year}.", after=6)

# ---- I. Tóm tắt
H("I. TÓM TẮT TUẦN")
T(["Chỉ tiêu", "Kết quả tuần", "Ghi chú"], [
    ["Số ca/ngày sản xuất; dây chuyền chạy (TH1, TH2, TH3, lò hơi, trộn hữu cơ)", "", "Trộn hữu cơ G07 hiện không vận hành"],
    ["Nước thải xử lý (m³/tuần); công suất thiết kế 120 m³/ngày đêm", "", ""],
    ["Số lần nước thải đầu ra vượt QCVN 40:2011 cột A (× Kq 1,2 × Kf 1,1)", "", "Theo phiếu nội bộ"],
    ["Số lần ΔP lọc túi > 260 mmH₂O; số lần khói đen/bụi thấy được", "", ""],
    ["Chất thải nguy hại phát sinh/chuyển giao (kg)", "", "Theo biên bản giao nhận"],
    ["Sự cố môi trường – an toàn – PCCC; tai nạn lao động", "", "Khai báo ngay nếu TNLĐ chết người hoặc ≥ 02 người bị thương nặng"],
    ["Số điểm không đạt kiểm tra hiện trường (BM3 ngày, BM2 tuần)", "", ""],
], [7, 3.5, 5.5], blank_rows=0)

# ---- II. HTXLNT
H("II. HỆ THỐNG XỬ LÝ NƯỚC THẢI (MT-HD04; GPMT 2986 – 120 m³/ngày đêm, xả sông Vàm Cỏ Đông)")
P("Giá trị tham chiếu: pH xả 6–9; SV30 duy trì 200–250 mL/L, xả bùn khi > 300 mL/L; COD, SS theo dõi 3–5 lần/tuần, BOD₅ 1 lần/tuần (nội bộ). Nước thải không thuộc đối tượng quan trắc định kỳ theo GPMT — giám sát nội bộ đủ 9 thông số.", italic=True, size=11)
T(["Ngày", "Lưu lượng (m³)", "pH vào/ra", "SV30 (mL/L)", "COD (mg/L)", "SS (mg/L)", "Hóa chất đã dùng", "Sự cố / ghi chú"],
  [[(mon + dt.timedelta(days=i)).strftime("%a %d/%m").replace("Mon", "T2").replace("Tue", "T3").replace("Wed", "T4").replace("Thu", "T5").replace("Fri", "T6").replace("Sat", "T7").replace("Sun", "CN")] + [""] * 7 for i in range(7)],
  [1.9, 1.8, 1.7, 1.7, 1.7, 1.6, 2.6, 2.6], size=10)

# ---- III. Khí thải
H("III. HỆ THỐNG XỬ LÝ KHÍ THẢI (MT-HD05)")
P("Giới hạn GPMT 2986: QCVN 19:2009 cột B (Kp 0,8; Kv 1,0): bụi 160, SO₂ 400, NOx 680, CO 800; dòng 02–07 thêm NH₃ 40 mg/Nm³. Cảnh báo ΔP lọc túi khi > 260 mmH₂O; kiểm tra dòng điện quạt 2 giờ/lần; CEMS chỉ dòng 06 (tự nguyện).", italic=True, size=11)
T(["Nguồn", "Thiết bị xử lý", "ΔP max (mmH₂O)", "Màu khói", "Quạt (A)", "Sự cố / tình trạng"], [
    ["01 Lò hơi", "Lọc ướt + tháp NaOH", "", "", "", ""],
    ["02/03 TH1", "Cyclone + lọc túi", "", "", "", ""],
    ["04/05 TH2", "Cyclone + lọc túi (432 túi)", "", "", "", ""],
    ["06 TH3", "Lọc túi + CEMS", "", "", "", "Dữ liệu CEMS: …"],
    ["07 Trộn HC", "—", "", "", "", "Không vận hành"],
], [2.4, 4, 2.4, 2, 1.8, 3.4], size=10)

# ---- IV. Chất thải
H("IV. QUẢN LÝ CHẤT THẢI")
T(["Loại", "Phát sinh trong tuần (kg)", "Chuyển giao (kg)", "Đơn vị tiếp nhận / số chứng từ", "Tồn kho cuối tuần (kg)"], [
    ["CTRSH (3 nhóm theo Điều 75 Luật BVMT)", "", "", "", ""],
    ["CTR công nghiệp thông thường", "", "", "", ""],
    ["CTNH (dầu nhớt thải, giẻ dính dầu, bóng đèn…)", "", "", "", "Lưu kho tối đa 01 năm"],
    ["Bao bì thải (bao PP dệt, EPR)", "", "", "", ""],
], [5.3, 2.8, 2.5, 3.5, 2.5], size=10)

# ---- V. Kiểm tra hiện trường
H("V. KIỂM TRA HIỆN TRƯỜNG, VỆ SINH CÔNG NGHIỆP (MT-QT02-BM2, BM3)")
T(["Khu vực", "Đạt/Không đạt", "Tồn tại ghi nhận", "Bộ phận chịu trách nhiệm", "Hạn khắc phục", "Đã khắc phục"], [], [3, 2.2, 4.2, 2.8, 2, 1.8], size=10, blank_rows=5)

# ---- VI. An toàn
H("VI. AN TOÀN – PCCC – SỨC KHỎE NGHỀ NGHIỆP")
for x in ["Huấn luyện ATVSLĐ/PCCC trong tuần: …", "Kiểm tra phương tiện PCCC, thẻ bình chữa cháy (hằng tháng): …", "Tình hình khám sức khỏe, bệnh nghề nghiệp, bồi dưỡng hiện vật (sau QTMTLĐ 03/2026): …", "Nhà thầu làm việc trong tuần; cam kết MT–AT–PCCC (MT-HD07-01) đã ký: …"]:
    P("– " + x, after=1)

# ---- VII. Sự cố
H("VII. SỰ CỐ, VI PHẠM, HÀNH ĐỘNG KHẮC PHỤC (ISO 14001 mục 10.2)")
T(["Ngày", "Nội dung sự cố/vi phạm", "Nguyên nhân", "Biện pháp khắc phục", "Hạn", "Trạng thái"], [], [1.8, 4.2, 3, 3.6, 1.6, 1.8], size=10, blank_rows=3)

# ---- VIII. Hạng mục theo dõi (tự tính ngày)
H("VIII. HẠNG MỤC THEO DÕI VÀ MỐC THỜI HẠN")
def left(d): n = (d - day).days; return f"còn {n} ngày" if n >= 0 else f"quá {-n} ngày"
D = dt.date
items = [
    ("Chứng nhận ISO 14001:2015 hết hạn; soát xét tài liệu, đánh giá nội bộ, xem xét lãnh đạo", D(2026, 12, 24), "Soát xét MT-QT01…03, MT-HD01…03, MT-HD06 (ban hành 2018); đánh giá nội bộ"),
    ("Hồ sơ điều chỉnh GPMT 2986 (lò hơi sinh khối 6 t/h chính, than 8 t/h dự phòng; mô hình Gauss)", None, "Theo dõi phản hồi Sở NN&MT Tây Ninh; chưa chấp thuận thì không vận hành ngoài GPMT"),
    ("Kê khai phí BVMT khí thải, nước thải quý IV/2026", D(2027, 1, 20), "Số liệu quý IV; đối chiếu lưu lượng/thông số"),
    ("Báo cáo công tác BVMT năm 2026", D(2027, 1, 15), "Soạn theo TT 02/2022/TT-BTNMT; rà số liệu 498/BC.KS"),
    ("Báo cáo ATVSLĐ, TNLĐ, y tế lao động năm 2026", D(2027, 1, 10), "Sở Nội vụ, Sở Y tế"),
    ("Kiểm kê khí nhà kính (số liệu 2025–2026), nộp UBND tỉnh", D(2027, 3, 31), "Kỳ 2 năm/lần"),
    ("EPR bao bì: kê khai số liệu 2026; nộp Quỹ", D(2027, 4, 1), "Nộp Quỹ BVMT Việt Nam trước 20/04/2027"),
    ("Kiểm toán năng lượng (cơ sở trọng điểm, 3 năm/lần)", D(2027, 12, 31), "Phạm vi phải có hệ nhiệt"),
]
T(["Hạng mục", "Hạn", "Còn lại", "Việc cần làm / ghi chú"], [[a, f(d) if d else "—", left(d) if d else "—", n] for a, d, n in items], [6.2, 2.2, 2, 5.6], size=10)

# ---- IX. Kế hoạch tuần tới
H(f"IX. KẾ HOẠCH TUẦN {nxt.isocalendar()[1]}/{nxt.year} ({f(nxt)} – {f(nsun)})")
plan = ["Vận hành, ghi nhật ký HTXLNT và khí thải theo ca (MT-HD04, MT-HD05); đo COD, SS 3–5 lần/tuần, BOD₅ 1 lần/tuần.", "Kiểm tra hiện trường hằng ngày (BM3) và tuần (BM2); chốt tồn tại tuần này.", "Tổng hợp CTNH, chứng từ giao nhận; kiểm tra thùng phân loại tại nguồn."]
if nxt.day <= 7 or (nxt.month != mon.month): plan.append("Đầu tháng: tổng hợp điện, nước, giấy, CTNH tháng trước; chấm điểm VSCN tháng (Hội đồng ATVSLĐ); kiểm tra thẻ bình chữa cháy.")
if nxt.month in (12, 1): plan.append("Chuẩn bị số liệu báo cáo công tác BVMT năm; phí BVMT quý IV (hạn 20/01).")
plan += ["……………………………………………………………………", "……………………………………………………………………"]
for x in plan: P("– " + x, after=1)

H("X. KIẾN NGHỊ, ĐỀ XUẤT")
_last = None
P("……………………………………………………………………………………………………………………", after=1); P("……………………………………………………………………………………………………………………")

# ---- Ký
sg = doc.add_table(rows=1, cols=3); sg.autofit = False
trPr = sg.rows[0]._tr.get_or_add_trPr(); cs = OxmlElement("w:cantSplit"); trPr.append(cs)
for c, (a1, a2) in zip(sg.rows[0].cells, [("NGƯỜI LẬP", "Trình Thiên Phương"), ("TRƯỞNG PHÒNG KT-SX", "Võ Anh Tuấn"), ("DUYỆT – PTGĐ", "Võ Văn Phu")]):
    c.text = ""; p = c.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER; r = p.add_run(a1 + "\n\n\n\n"); r.bold = True; p.add_run(a2)
P("")
P("Nơi nhận: Ban Giám đốc; Phòng KT-SX; lưu hồ sơ HSE.", italic=True, size=11)

# ---- Ghi chú nội bộ (đỏ)
doc.add_page_break()
red = (0xC0, 0x00, 0x00)
P("GHI CHÚ NỘI BỘ — XÓA TRANG NÀY TRƯỚC KHI NỘP", bold=True, color=red)
for x in ["Mẫu tự điền: ngày, hạn và số ngày còn lại tính theo ngày lập báo cáo; các ô số liệu hiện trường để trống, không có số giả định.",
          "Hạng mục VIII: mốc ISO 14001 (24/12/2026), báo cáo BVMT (15/01), phí quý (20 tháng đầu quý sau), KNK (31/03/2027), EPR (01/04 kê khai – 20/04 nộp) lấy theo hồ sơ nhà máy; số liệu EPR/KNK cần xác nhận với văn bản hợp nhất mới nhất.",
          "Hạn báo cáo ATVSLĐ năm (10/01) và nơi nhận (Sở Nội vụ, Sở Y tế): xác nhận Công ty tổng hợp hay chi nhánh tự nộp.",
          "Giới hạn khí thải/nước thải lấy từ GPMT 2986. Báo cáo điều chỉnh GPMT chưa được chấp thuận: dùng giới hạn GPMT hiện hành.",
          "Không ghi nội dung phạt tiền người lao động trong báo cáo; xử lý vi phạm nội bộ theo BLLĐ hoặc quy chế lương thưởng."]:
    P("• " + x, color=red, size=11, after=2)

import os; os.makedirs(os.path.dirname(out), exist_ok=True); doc.save(out); print(out)
