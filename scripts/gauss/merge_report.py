#!/usr/bin/env python3
"""Lập bản báo cáo đề xuất điều chỉnh GPMT lò hơi (mới): báo cáo gốc + Phụ lục sửa đổi 20/11/2026 (hai lò vận hành luân phiên) + mục d) mô hình Gauss.
Chạy: python3 scripts/gauss/merge_report.py gauss.json orig.docx out.docx figs_dir"""
import json, sys, copy, re
from docx import Document
from docx.shared import Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement, parse_xml

G, SRC, OUT, FIG = json.load(open(sys.argv[1])), sys.argv[2], sys.argv[3], sys.argv[4]
B = {b["id"]: b for b in G["boilers"]}; LIM05 = G["meta"]["LIM05"]
d = Document(SRC); body = d.element.body
P = [e for e in body.iterchildren() if e.tag == qn("w:p")]
T = [t._tbl for t in d.tables]
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

def f(x, n=1):
    s = f"{x:,.{n}f}"; return s.replace(",", "§").replace(".", ",").replace("§", ".")
def txt(el): return "".join(x.text or "" for x in el.iter(qn("w:t")))

# ── thao tác cơ bản ─────────────────────────────────────────────────────
def settext(p, text, run_idx=0):
    runs = p.findall(qn("w:r"))
    if not runs: raise RuntimeError("đoạn không có run: " + txt(p)[:50])
    r = runs[min(run_idx, len(runs) - 1)]
    for t in r.findall(qn("w:t")): r.remove(t)
    t = OxmlElement("w:t"); t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve"); t.text = text; r.append(t)
    for o in runs:
        if o is not r and runs.index(o) >= (run_idx if run_idx else 0) and o is not r: p.remove(o)
    for h in p.findall(qn("w:hyperlink")): p.remove(h)
def replace_in(p, old, new):
    s = txt(p); assert old in s, (old, s[:80]); settext(p, s.replace(old, new))
def clone_after(anchor, template, text):
    n = copy.deepcopy(template); settext(n, text); anchor.addnext(n); return n
def cell_paras(tc): return tc.findall(qn("w:p"))
def set_cell(tc, lines):
    ps = cell_paras(tc); first = ps[0]
    for p in ps[1:]: tc.remove(p)
    lines = lines if isinstance(lines, list) else [lines]
    settext(first, lines[0]); cur = first
    for ln in lines[1:]:
        n = copy.deepcopy(first); settext(n, ln); cur.addnext(n); cur = n
def tcs(tbl, r): return tbl.findall(qn("w:tr"))[r].findall(qn("w:tc"))
def set_reason(tc, text):       # ô "Lý do điều chỉnh:" — giữ nhãn đậm (run 0), thay nội dung (run 1)
    p = cell_paras(tc)[0]; runs = p.findall(qn("w:r"))
    if len(runs) >= 2: settext(p, text, run_idx=1)
    else: settext(p, "Lý do điều chỉnh: " + text)

# ── dựng phần tử mới theo định dạng của báo cáo gốc ──────────────────────
RF = '<w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/>'
def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
def mkp(text, kind="body"):
    ppr, rpr = {
        "body": ('<w:spacing w:after="100" w:before="0" w:line="320"/><w:ind w:firstLine="567"/><w:jc w:val="both"/>', '<w:sz w:val="26"/><w:szCs w:val="26"/>'),
        "bullet": ('<w:spacing w:after="60" w:before="0" w:line="320"/><w:ind w:left="340" w:hanging="340"/><w:jc w:val="both"/>', '<w:sz w:val="26"/><w:szCs w:val="26"/>'),
        "sub": ('<w:keepNext/><w:spacing w:after="60" w:before="120" w:line="320"/><w:jc w:val="both"/>', '<w:b/><w:bCs/><w:i/><w:iCs/><w:sz w:val="26"/><w:szCs w:val="26"/>'),
        "subsub": ('<w:keepNext/><w:spacing w:after="60" w:before="0" w:line="320"/><w:ind w:firstLine="567"/><w:jc w:val="both"/>', '<w:b/><w:bCs/><w:sz w:val="26"/><w:szCs w:val="26"/>'),
        "caption": ('<w:keepNext/><w:spacing w:after="60" w:before="120" w:line="320"/><w:jc w:val="center"/>', '<w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/>'),
        "formula": ('<w:spacing w:after="100" w:before="0" w:line="320"/><w:jc w:val="center"/>', '<w:i/><w:iCs/><w:sz w:val="24"/><w:szCs w:val="24"/>'),
        "note": ('<w:spacing w:after="100" w:before="40" w:line="280"/><w:jc w:val="both"/>', '<w:i/><w:iCs/><w:sz w:val="22"/><w:szCs w:val="22"/>'),
        "hl": ('<w:spacing w:after="60" w:before="120" w:line="320"/><w:jc w:val="both"/>', '<w:b/><w:bCs/><w:sz w:val="26"/><w:szCs w:val="26"/>'),
    }[kind]
    return parse_xml(f'<w:p xmlns:w="{W}"><w:pPr>{ppr}</w:pPr><w:r><w:rPr>{RF}{rpr}</w:rPr><w:t xml:space="preserve">{esc(text)}</w:t></w:r></w:p>')
def mktable(rows, widths, size=20, hdr=True):
    tw = sum(widths)
    grid = "".join(f'<w:gridCol w:w="{w}"/>' for w in widths)
    out = [f'<w:tbl xmlns:w="{W}"><w:tblPr><w:tblW w:type="dxa" w:w="{tw}"/><w:tblBorders>' + "".join(f'<w:{s} w:val="single" w:color="auto" w:sz="4"/>' for s in ("top", "left", "bottom", "right", "insideH", "insideV")) + f'</w:tblBorders></w:tblPr><w:tblGrid>{grid}</w:tblGrid>']
    for i, r in enumerate(rows):
        h = hdr and i == 0
        out.append("<w:tr><w:trPr><w:cantSplit/>" + ("<w:tblHeader/>" if h else "") + "</w:trPr>")
        for j, v in enumerate(r):
            shd = '<w:shd w:fill="D9E2F3" w:color="auto" w:val="clear"/>' if h else ""
            bold = "<w:b/><w:bCs/>" if h or (j == 0 and False) else ""
            jc = "center" if (h or j > 0) else "left"
            out.append(f'<w:tc><w:tcPr><w:tcW w:type="dxa" w:w="{widths[j]}"/><w:tcBorders>' + "".join(f'<w:{s} w:val="single" w:color="000000" w:sz="4"/>' for s in ("top", "left", "bottom", "right")) + f'</w:tcBorders>{shd}<w:tcMar><w:top w:type="dxa" w:w="50"/><w:left w:type="dxa" w:w="90"/><w:bottom w:type="dxa" w:w="50"/><w:right w:type="dxa" w:w="90"/></w:tcMar><w:vAlign w:val="center"/></w:tcPr>')
            for k, line in enumerate(str(v).split("\n")):
                out.append(f'<w:p><w:pPr><w:spacing w:after="0" w:line="260"/><w:jc w:val="{jc}"/></w:pPr><w:r><w:rPr>{RF}{bold}<w:sz w:val="{size}"/><w:szCs w:val="{size}"/></w:rPr><w:t xml:space="preserve">{esc(line)}</w:t></w:r></w:p>')
            out.append("</w:tc>")
        out.append("</w:tr>")
    out.append("</w:tbl>")
    return parse_xml("".join(out))
def mkpic(path, width_cm):
    p = d.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.keep_with_next = True
    p.add_run().add_picture(path, width=Cm(width_cm)); el = p._p; body.remove(el); return el

# ═════════ 1. Trang bìa, mở đầu, công nghệ ═════════
settext(P[8], "Nội dung điều chỉnh: Bổ sung lò hơi tầng sôi ống nước đốt sinh khối 6.000 kg hơi/giờ (lò chính)")
settext(P[9], "vận hành luân phiên với lò hơi đốt than 8 tấn hơi/giờ hiện hữu (dự phòng)")
settext(P[28], "Lò hơi đốt than hiện hữu đã vận hành nhiều năm, hiệu suất thấp, chi phí nhiên liệu cao (than chiếm 63,8% tổng phát thải khí nhà kính và khoảng 2/3 tổng năng lượng quy đổi của Nhà máy). Thực hiện kế hoạch giảm nhẹ phát thải khí nhà kính giai đoạn 2026–2030 của Tập đoàn Hóa chất Việt Nam và của Công ty, đồng thời tăng cường công tác bảo vệ môi trường, Công ty đầu tư bổ sung lò hơi tầng sôi ống nước 01 balong sử dụng nhiên liệu sinh khối, công suất sinh hơi 6.000 kg/giờ (gói thầu E-TBMT số IB2600448600, mở thầu ngày 17/9/2026) làm lò hơi chính vận hành các ngày trong tuần, đồng thời giữ lại lò hơi đốt than hiện hữu để vận hành luân phiên vào cuối tuần.")
replace_in(P[29], "việc thay thế thiết bị đốt sang nhiên liệu thân thiện với môi trường không làm gia tăng", "việc bổ sung thiết bị đốt nhiên liệu thân thiện với môi trường (sinh khối) vận hành luân phiên với thiết bị hiện hữu không làm gia tăng")
replace_in(P[35], "Việc điều chỉnh chỉ thay đổi thiết bị sinh hơi và nhiên liệu đốt.", "Việc điều chỉnh bổ sung thiết bị sinh hơi đốt sinh khối, vận hành luân phiên với lò hơi đốt than hiện hữu.")
settext(P[38], "Khí thải ra khỏi lò hơi sinh khối được dẫn qua cyclone chùm (đồng bộ theo lò) để tách tro bay thô, sau đó qua thiết bị lọc bụi túi vải chịu nhiệt để xử lý triệt để bụi mịn, rồi được quạt hút mới đẩy ra ống khói hiện hữu. Do nhiên liệu sinh khối có hàm lượng lưu huỳnh không đáng kể nên khí thải lò sinh khối không cần qua công đoạn hấp thụ bằng dung dịch kiềm; hệ thống xử lý ướt hiện hữu (lọc bụi ướt và hấp thụ dung dịch kiềm) được giữ nguyên, không tháo dỡ, để xử lý khí thải lò hơi than khi vận hành luân phiên.")
reg = clone_after(P[38], P[38], "Công ty giữ lại lò hơi đốt than 8 tấn hơi/giờ hiện hữu để vận hành luân phiên cố định với lò hơi sinh khối, nhằm bảo đảm cấp hơi liên tục cho sản xuất trong điều kiện nhân sự vận hành, bảo trì và nguồn cung nhiên liệu sinh khối không bố trí vào cuối tuần. Cụ thể: lò hơi tầng sôi đốt sinh khối vận hành các ngày trong tuần (Thứ Hai đến Thứ Sáu); lò hơi đốt than vận hành vào Thứ Bảy và Chủ Nhật hàng tuần (tương đương khoảng 8 ngày/tháng, 96 ngày/năm, chiếm khoảng 26% thời gian trong năm) hoặc khi lò sinh khối gặp sự cố. Hai lò hơi không vận hành đồng thời, sử dụng chung ống khói hiện hữu (cao 18 m, Ø700 mm) nhưng theo hai tuyến thu gom, xử lý bụi và khí thải riêng biệt (xem Bảng 2.1).")
settext(P[39], "Thông số kỹ thuật của lò hơi hiện hữu và lò hơi đầu tư bổ sung được trình bày tại Bảng 1.1.")

# Bảng 1.1
t = T[1]
c = tcs(t, 1); ps = cell_paras(c[3]); settext(ps[0], "Bổ sung 01 lò hơi tầng sôi ống nước 01 balong"); n = copy.deepcopy(ps[-1]); settext(n, "Vận hành luân phiên với lò hơi than hiện hữu theo lịch cố định (xem Mục 1.3.2)"); ps[-1].addnext(n)
set_cell(c[4], "Bổ sung lò sinh khối vận hành luân phiên (ngày thường); giữ nguyên lò than (cuối tuần), không tháo dỡ")
set_cell(tcs(t, 4)[4], "Bổ sung tuyến xử lý khô cho lò sinh khối; tuyến ướt hiện hữu của lò than giữ nguyên")
set_cell(tcs(t, 6)[3], "Giữ nguyên, vận hành luân phiên cùng lò than (Thứ Bảy, Chủ Nhật); tiêu thụ NaOH giảm còn ước tính ≈ 86 kg/tháng (*)")
set_cell(tcs(t, 6)[4], "Không ngừng sử dụng — duy trì song song với hệ xử lý khô của lò sinh khối, sẵn sàng vận hành khi lò than chạy")
set_cell(tcs(t, 7)[3], ["Giữ nguyên quạt hút hiện hữu 25.000 m³/giờ cho lò than; bổ sung 01 quạt hút mới riêng cho lò sinh khối, công suất thiết kế 40.000 m³/giờ, vận hành khống chế ≤ 25.000 m³/giờ bằng biến tần (xem Mục 2.2.2.c)"])
set_cell(tcs(t, 7)[4], "Hai quạt độc lập theo từng lò, không vận hành đồng thời; lưu lượng xả lớn nhất của nguồn 01 không đổi (25.000 m³/giờ)")

# ═════════ 2. Nhiên liệu, hóa chất ═════════
settext(P[45], "Nhu cầu nguyên liệu, vật liệu, điện năng, nguồn cung cấp điện và nước của dự án không thay đổi so với Giấy phép môi trường đã được cấp. Thay đổi duy nhất là nhiên liệu cấp cho lò hơi: bổ sung sinh khối cho lò hơi chính vận hành các ngày trong tuần; lượng than đá giảm do lò hơi than chỉ vận hành luân phiên vào cuối tuần; lượng NaOH dùng cho hấp thụ khí thải lò than giảm tương ứng.")
t = T[2]
set_cell(tcs(t, 1)[4], "≈ 1.225 (*)"); set_cell(tcs(t, 1)[5], "Phục vụ lò hơi than khi vận hành luân phiên (cuối tuần); số liệu hiện hữu lấy theo Bảng 1.2 hồ sơ điều chỉnh GPMT nguồn số 04")
set_cell(tcs(t, 3)[4], "≈ 86 (*)"); set_cell(tcs(t, 3)[5], "Hấp thụ khí thải khi lò than vận hành luân phiên")
clone_after(P[47], P[47], "(*) Than đá và NaOH: ước tính theo tỷ lệ 2/7 ngày vận hành (cuối tuần) so với mức tiêu thụ khi lò than vận hành toàn thời gian; cần xác nhận lại bằng số liệu thực đo trong giai đoạn vận hành thử nghiệm.")

# ═════════ 3. Chương 2 ═════════
settext(P[56], "Hệ thống thu gom, thoát nước mưa không thay đổi. Hệ thống xử lý nước thải tập trung công suất 120 m³/ngày đêm, quy trình công nghệ, điểm xả và nguồn tiếp nhận (sông Vàm Cỏ Đông) không thay đổi. Việc bổ sung lò hơi sinh khối vận hành luân phiên làm thay đổi tần suất và lưu lượng của nguồn phát sinh nước thải như sau:")
settext(P[57], "- Nguồn số 05 (nước thải từ hệ thống xử lý khí thải lò hơi than) tiếp tục phát sinh nhưng với tần suất và lưu lượng giảm, do lò than chỉ vận hành luân phiên vào Thứ Bảy, Chủ Nhật hàng tuần: lưu lượng ước tính giảm từ khoảng 7 m³/tuần xuống còn khoảng 2 m³/tuần (*) (tỷ lệ theo số ngày vận hành), vẫn phát sinh đều đặn hàng tuần.")
replace_in(P[58], "- Phát sinh nước xả đáy, xả bề mặt lò hơi sinh khối với lưu lượng khoảng 4,3 m³/ngày", "- Phát sinh nước xả đáy, xả bề mặt lò hơi sinh khối (các ngày lò sinh khối vận hành) với lưu lượng khoảng 4,3 m³/ngày")
settext(P[60], "So với hiện trạng, lưu lượng nước rửa hấp thụ kiềm (pH có thời điểm lên đến 12) giảm từ khoảng 7 m³/tuần xuống còn khoảng 2 m³/tuần (*), góp phần giảm biến động pH đầu vào của hệ thống xử lý nước thải; lượng nước này tiếp tục được điều tiết đưa về hố thu theo quy trình hiện hữu.")
settext(P[62], "Khi thực hiện điều chỉnh Giấy phép môi trường, Công ty đầu tư bổ sung 01 lò hơi tầng sôi ống nước đốt sinh khối công suất 6.000 kg hơi/giờ (lò chính, vận hành Thứ Hai – Thứ Sáu) và giữ lại lò hơi đốt than 8 tấn hơi/giờ hiện hữu vận hành luân phiên vào Thứ Bảy, Chủ Nhật. Hai lò hơi không vận hành đồng thời, dùng chung ống khói hiện hữu nhưng theo hai tuyến thu gom, xử lý bụi, khí thải riêng biệt: tuyến xử lý khô hai cấp cho lò sinh khối để nâng hiệu suất xử lý bụi, và tuyến xử lý ướt hiện hữu giữ nguyên cho lò than. Các công trình xử lý bụi, khí thải của các nguồn còn lại giữ nguyên theo Giấy phép môi trường số 2986/GPMT-STNMT ngày 28/4/2023.")
replace_in(P[64], "dẫn về hệ thống xử lý bụi, khí thải. Khí thải", "dẫn về hệ thống xử lý bụi, khí thải; khí thải lò hơi than tiếp tục theo tuyến thu gom hiện hữu. Khí thải")
# Bảng 2.1: hai tuyến song song
t = T[4]
set_cell(tcs(t, 0)[0], "Tuyến 1 — Lò hơi sinh khối (Thứ Hai – Thứ Sáu)"); set_cell(tcs(t, 0)[1], "Tuyến 2 — Lò hơi than (luân phiên Thứ Bảy, Chủ Nhật)")
set_cell(tcs(t, 1)[0], ["Khí thải lò hơi sinh khối", "↓", "Cyclone chùm (hiệu suất ≥ 90%)", "↓", "Lọc bụi túi vải chịu nhiệt (hiệu suất ≥ 99%)", "↓", "Quạt hút mới (40.000 m³/giờ, khống chế ≤ 25.000 m³/giờ)", "↓", "Ống khói chung (18 m; Ø 700 mm)", "", "→ Không phát sinh nước thải"])
set_cell(tcs(t, 1)[1], ["Khí thải lò hơi than", "↓", "Tháp dập bụi ướt + bể dập bụi", "↓", "Hấp thụ bằng dung dịch kiềm (NaOH)", "↓", "Quạt hút hiện hữu (25.000 m³/giờ)", "↓", "Ống khói chung (18 m; Ø 700 mm)", "", "→ Phát sinh nước thải ≈ 2 m³/tuần (*)"])
replace_in(P[72], "quạt hút đẩy ra ống khói cao 18 m, đường kính D = 700 mm, xả liên tục theo thời gian vận hành của lò hơi.", "quạt hút mới đẩy ra ống khói chung cao 18 m, đường kính D = 700 mm, xả liên tục theo thời gian vận hành của lò hơi sinh khối.")
settext(P[75], "Do nhiên liệu sinh khối có hàm lượng lưu huỳnh rất thấp, nồng độ SO₂ trong khí thải lò sinh khối thấp hơn nhiều so với giới hạn cho phép (xem mục c) nên khí thải lò sinh khối không qua công đoạn hấp thụ bằng dung dịch kiềm. Thiết bị lọc bụi ướt và tháp hấp thụ hiện hữu được giữ nguyên, không tháo dỡ, vận hành luân phiên cùng lò than (Thứ Bảy, Chủ Nhật) với quạt hút hiện hữu 25.000 m³/giờ: khí thải lò than được dập bụi ướt, hấp thụ bằng dung dịch NaOH rồi thoát ra ống khói chung.")
clone_after(P[83], P[83], "Quạt hút của lò hơi sinh khối được lựa chọn với công suất thiết kế 40.000 m³/giờ nhằm dự phòng tổn thất áp suất khi cụm lọc bụi túi vải bị bám bẩn theo thời gian vận hành; lưu lượng vận hành thực tế được khống chế không vượt quá 25.000 m³/giờ bằng biến tần lắp kèm quạt, bảo đảm không vượt lưu lượng xả lớn nhất đã được cấp phép tại nguồn số 01. Quạt hút của lò hơi than hiện hữu (25.000 m³/giờ) được giữ nguyên, sử dụng riêng khi lò than vận hành luân phiên.")
settext(P[89], "Việc bổ sung lò hơi sinh khối vận hành chính cũng làm giảm phát thải khí nhà kính: lượng than giảm từ 4.286 xuống còn khoảng 1.225 tấn/năm (*), tức giảm khoảng 3.061 tấn/năm, tương ứng khoảng 8.030 tấn CO₂/năm (hệ số phát thải 98.300 kg CO₂/TJ, nhiệt trị than 26,7 GJ/tấn); phần CO₂ sinh ra từ đốt sinh khối là CO₂ sinh học, không tính vào phát thải của cơ sở.")

# ── mục d) mô hình Gauss ──────────────────────────────────────────────────
a1, b1, a2, b2 = B["LH01-A"], B["LH01-B"], B["LH02-A"], B["LH02-B"]
POL = ["tsp", "so2", "nox", "co"]; PN = {"tsp": "Bụi tổng", "so2": "SO₂", "nox": "NO₂ (NOₓ)", "co": "CO"}
BGv = {"tsp": (55, 178), "so2": (30, 136), "nox": (10, 70), "co": (743, 29780)}
cur = P[89]
def add(el):
    global cur; cur.addnext(el); cur = el
add(mkp("d) Đánh giá khả năng phát tán bụi, khí thải từ nguồn số 01 bằng mô hình Gauss", "sub"))
add(mkp("Mục đích và phạm vi", "subsub"))
add(mkp("Nồng độ bụi, SO₂, NO₂ (NOₓ) và CO ở mặt đất do nguồn số 01 gây ra được đánh giá bằng mô hình phát tán Gauss nguồn điểm liên tục cho hai chế độ vận hành luân phiên, không đồng thời, dùng chung ống khói hiện hữu (cao 18 m, Ø700 mm, tọa độ X = 1172156; Y = 580206): (i) lò hơi sinh khối 6 tấn hơi/giờ — lò chính, Thứ Hai – Thứ Sáu, ≈ 6.200 giờ/năm; (ii) lò hơi than 8 tấn hơi/giờ — dự phòng, luân phiên Thứ Bảy, Chủ Nhật (≈ 96 ngày/năm). Do không vận hành đồng thời nên mỗi chế độ được tính riêng, không cộng gộp. Kết quả được so sánh với QCVN 05:2023/BTNMT (trung bình 1 giờ): TSP 300; SO₂ 350; NO₂ 200; CO 30.000 μg/m³."))
add(mkp("Phương pháp", "subsub"))
for s in ["Mô hình vệt khói Gauss có phản xạ mặt đất và giới hạn bởi lớp xáo trộn: C = Q/(2π·u·σy·σz) · exp(−y²/2σy²) · [exp(−(z−H)²/2σz²) + exp(−(z+H)²/2σz²)]; σy, σz theo Pasquill–Gifford (công thức EPA ISC3, địa hình nông thôn); sáu lớp ổn định khí quyển A–F.",
          "Độ nâng vệt khói theo Briggs (ISC3), có xét cuốn xuống đỉnh ống khói; lớp xáo trộn theo SCREEN3; gió quy đổi từ 10 m lên độ cao ống khói bằng hàm mũ.",
          "Điều kiện khí tượng bất lợi nhất: quét 54 tổ hợp lớp ổn định × tốc độ gió hợp lệ theo bảng sàng lọc SCREEN3, lấy tổ hợp cho nồng độ lớn nhất; nhiệt độ không khí 30 °C; điểm nhận ở độ cao 1,5 m; nồng độ trung bình 1 giờ trên trục gió, không xét phân hủy hay lắng (bảo thủ).",
          "Kịch bản: (A) số liệu thiết kế đối với lò sinh khối (Bảng 2.2) và kết quả quan trắc khí thải năm 2026 đối với lò than (phiếu 0731/2026/DV, 1461/2026/DV: bụi 19; SO₂ 55; NOₓ 34; CO 79 mg/Nm³; 19.636 m³/giờ; 86 °C); (B) giả thiết bảo thủ khí thải xả đúng bằng giới hạn QCVN 19:2009 (Kp = 0,8) ở lưu lượng xả lớn nhất cấp phép 25.000 m³/giờ."]:
    add(mkp("- " + s, "bullet"))
add(mkp("Thông số nguồn và tải lượng", "subsub"))
add(mkp("Bảng 2.2a. Thông số ống khói và điều kiện khí thải dùng trong mô hình", "caption"))
ks = ["LH01-A", "LH01-B", "LH02-A", "LH02-B"]; hd = ["Thông số", "Lò sinh khối\n(A: thiết kế)", "Lò sinh khối\n(B: giới hạn)", "Lò than\n(A: quan trắc 2026)", "Lò than\n(B: giới hạn)"]
rows = [hd, ["Chiều cao / đường kính ống khói (m)"] + ["18 / 0,7"] * 4, ["Nhiệt độ khí thải (°C)"] + [f(B[k]["tC"], 0) for k in ks], ["Lưu lượng thực (m³/giờ)"] + [f(B[k]["flowA"], 0) for k in ks],
        ["Lưu lượng chuẩn, 25 °C (Nm³/giờ)"] + [f(B[k]["flowN"], 0) for k in ks], ["Vận tốc ra ống khói (m/s)"] + [f(B[k]["vs"], 1) for k in ks]]
add(mktable(rows, [2900, 1600, 1600, 1650, 1600], 20)); add(mkp("", "note"))
add(mkp("Bảng 2.2b. Tải lượng phát thải dùng trong mô hình (g/s)", "caption"))
rows = [["Chất ô nhiễm"] + ["Lò sinh khối (A)", "Lò sinh khối (B)", "Lò than (A)", "Lò than (B)"]]
for p in POL:
    r = [PN[p]]
    for k in ks:
        pp = B[k]["per"].get(p); r.append("chưa có số liệu (*)" if pp is None else f(pp["Q"], 4 if pp["Q"] < 0.1 else 3))
    rows.append(r)
add(mktable(rows, [2300, 1800, 1800, 1800, 1650], 20))
add(mkp("Lò sinh khối (A): tải lượng theo cân bằng chất tại Bảng 2.2 (bụi sau xử lý ≈ 3,8 mg/Nm³ tại 0 °C; SO₂ 0,42 kg/giờ; NOₓ 2,32 kg/giờ); CO của lò sinh khối chưa có số liệu nhà cung cấp nên chỉ được xét ở kịch bản B.", "note"))
add(mkp("Kết quả mô hình", "subsub"))
add(mkp("Bảng 2.2c. Nồng độ cực đại 1 giờ ở mặt đất do nguồn số 01 (μg/m³; trong ngoặc là % giới hạn QCVN 05:2023)", "caption"))
rows = [["Chất", "Giới hạn 1 giờ", "Lò sinh khối (A)", "Lò sinh khối (B)", "Lò than (A)", "Lò than (B)"]]
for p in POL:
    r = [PN[p], f(LIM05[p], 0)]
    for k in ks:
        pp = B[k]["per"].get(p); r.append("chưa có số liệu (*)" if pp is None else f"{f(pp['cmax'], 2 if pp['cmax'] < 10 else 1)} ({f(pp['cmax'] / LIM05[p] * 100, 1)}%)")
    rows.append(r)
rows.append(["Điều kiện bất lợi nhất", "—"] + [f"lớp {B[k]['worst']['st']}, gió {f(B[k]['worst']['u10'], 1)} m/s,\ncách {f(B[k]['worst']['x'], 0)} m" for k in ks])
add(mktable(rows, [1700, 1250, 1600, 1600, 1600, 1600], 19)); add(mkp("", "note"))
add(mkp("Bảng 2.2d. Nồng độ cực đại 1 giờ theo khoảng cách (μg/m³), kịch bản A — mọi tổ hợp khí tượng", "caption"))
rows = [["Khoảng cách (m)", "Bụi — sinh khối", "SO₂ — sinh khối", "NO₂ — sinh khối", "Bụi — than", "SO₂ — than", "NO₂ — than"]]
for x in [100, 200, 300, 500, 1000, 2000]:
    r = [f(x, 0)]
    for k in ["LH01-A", "LH02-A"]:
        a = next(q for q in B[k]["atDist"] if q["x"] == x)
        for p in ["tsp", "so2", "nox"]: r.append(f(a["cPerQ"] * B[k]["per"][p]["Q"], 2))
    rows.append(r)
add(mktable(rows, [1500, 1300, 1300, 1300, 1300, 1300, 1354], 19)); add(mkp("", "note"))
add(mkpic(f"{FIG}/hinh1_nong_do_theo_khoang_cach.png", 15.5))
add(mkp("Hình 2.1. Nồng độ NO₂ và SO₂ theo khoảng cách xuôi gió ở điều kiện khí tượng bất lợi nhất", "caption"))
add(mkp("Nhận xét", "subsub"))
pct = lambda b, p: b["per"][p]["cmax"] / LIM05[p] * 100
for s in [f"Lò hơi sinh khối (chế độ chính, số liệu thiết kế): nồng độ cực đại 1 giờ của bụi {f(a1['per']['tsp']['cmax'], 2)}, SO₂ {f(a1['per']['so2']['cmax'], 1)} và NO₂ {f(a1['per']['nox']['cmax'], 1)} μg/m³, tương ứng {f(pct(a1, 'tsp'), 1)}%, {f(pct(a1, 'so2'), 1)}% và {f(pct(a1, 'nox'), 1)}% giới hạn QCVN 05:2023; cực đại xảy ra cách ống khói khoảng {f(a1['worst']['x'], 0)} m.",
          f"Lò hơi than (chế độ dự phòng, kết quả quan trắc 2026): bụi {f(a2['per']['tsp']['cmax'], 1)}, SO₂ {f(a2['per']['so2']['cmax'], 1)}, NO₂ {f(a2['per']['nox']['cmax'], 1)}, CO {f(a2['per']['co']['cmax'], 1)} μg/m³, tương ứng {f(pct(a2, 'tsp'), 1)}%, {f(pct(a2, 'so2'), 1)}%, {f(pct(a2, 'nox'), 1)}% và {f(pct(a2, 'co'), 2)}% giới hạn.",
          f"Ngay cả khi giả thiết khí thải xả bằng giới hạn QCVN 19:2009 ở lưu lượng lớn nhất cấp phép, đóng góp riêng của nguồn số 01 vẫn thấp hơn giới hạn QCVN 05:2023: lò sinh khối — NO₂ {f(b1['per']['nox']['cmax'], 1)} μg/m³ ({f(pct(b1, 'nox'), 0)}%); lò than — NO₂ {f(b2['per']['nox']['cmax'], 1)} μg/m³ ({f(pct(b2, 'nox'), 0)}%), SO₂ {f(b2['per']['so2']['cmax'], 1)} μg/m³ ({f(pct(b2, 'so2'), 0)}%). Đây là mức trần giả định; nồng độ thực đo thấp hơn nhiều (NOₓ thực đo 28 – 34 mg/Nm³ so với giới hạn 680 mg/Nm³).",
          f"Khi cộng nồng độ nền không khí xung quanh (tham khảo, quan trắc cấp tỉnh: TSP 55–178; SO₂ 30–136; NO₂ 10–70 μg/m³) thì các kịch bản A đều đạt; riêng kịch bản B của lò than cho tổng NO₂ ≈ {f(b2['per']['nox']['cmax'] + 70, 0)} μg/m³ nếu cộng nền cận trên, vượt giới hạn 200 μg/m³. Do nồng độ nền chưa có phiếu kết quả gốc của Nhà máy, Công ty sẽ bổ sung kết quả quan trắc không khí xung quanh khi hoàn thiện hồ sơ.",
          "Hai lò hơi không vận hành đồng thời nên không cộng dồn. Kết luận: việc vận hành luân phiên lò hơi sinh khối (chính) và lò hơi than (dự phòng) qua ống khói hiện hữu cao 18 m không làm nồng độ bụi, SO₂, NO₂, CO ở mặt đất vượt QCVN 05:2023/BTNMT do đóng góp riêng của nguồn số 01."]:
    add(mkp("- " + s, "bullet"))
add(mkp("Mô hình sàng lọc cho địa hình bằng phẳng, nguồn liên tục, chưa xét cuốn xuống do nhà xưởng và chế độ gió nhiều năm; CO của lò sinh khối (*) và nồng độ nền sẽ được cập nhật bằng số liệu thực đo trong giai đoạn vận hành thử nghiệm. Số liệu chi tiết, bảng theo lớp ổn định khí quyển và mã nguồn tính toán có tại tài liệu kèm theo (Phụ lục Gauss lò hơi nguồn 01).", "note"))

# ═════════ 4. Chất thải rắn, bảng tổng hợp ═════════
settext(P[94], "Việc bổ sung lò hơi đốt sinh khối làm giảm lượng xỉ than phát sinh từ lò hơi do lò than chỉ vận hành luân phiên vào cuối tuần (khoảng 25,5 tấn/tháng (*), giảm tương ứng tỷ lệ 2/7 ngày vận hành), đồng thời phát sinh thêm tro, xỉ từ nhiên liệu sinh khối với khối lượng khoảng 1% khối lượng nhiên liệu đầu vào, tương đương 66 tấn/năm = 5,5 tấn/tháng.")
t = T[6]; set_cell(tcs(t, 2)[4], "≈ 25,5 (*)"); set_cell(tcs(t, 6)[4], "51,82 (*)")
clone_after(P[96], P[96], "(*) Xỉ than ước tính theo tỷ lệ 2/7 ngày vận hành (cuối tuần), không phải 0 tuyệt đối; tổng cộng thay đổi theo (51,82 tấn/tháng).")
t = T[7]
set_cell(tcs(t, 1)[3], "Bổ sung lò hơi tầng sôi ống nước 01 balong đốt sinh khối, công suất 6.000 kg hơi/giờ, vận hành luân phiên với lò hơi than hiện hữu (không đồng thời); nhiên liệu sinh khối khoảng 6.600 tấn/năm; than đá giảm còn ≈ 1.225 tấn/năm (*)")
set_cell(tcs(t, 1)[4], "Bổ sung thiết bị; lò than giữ lại, vận hành luân phiên cuối tuần")
set_cell(tcs(t, 2)[3], "Hai tuyến riêng cho hai lò: lò sinh khối — cyclone chùm → lọc bụi túi vải → quạt hút mới → ống khói; lò than — lọc bụi ướt → hấp thụ bằng dung dịch kiềm → quạt hút hiện hữu → ống khói")
set_cell(tcs(t, 2)[4], "Bổ sung tuyến xử lý khô hai cấp cho lò sinh khối (hiệu suất bụi ≥ 99%); giữ nguyên tuyến ướt và công đoạn hấp thụ kiềm của lò than, vận hành luân phiên")
set_cell(tcs(t, 6)[3], "Nguồn số 05 tiếp tục phát sinh, lưu lượng giảm còn khoảng 2 m³/tuần (*); bổ sung nước xả đáy, xả bề mặt lò hơi sinh khối khoảng 4,3 m³/ngày đưa về hệ thống xử lý nước thải tập trung")
set_cell(tcs(t, 7)[3], "Khoảng 51,82 tấn/tháng (*), trong đó xỉ than ≈ 25,5 tấn/tháng (*); tro, xỉ sinh khối từ lò hơi 5,50 tấn/tháng")

# ═════════ 5. Chương 3 ═════════
t = T[8]
set_cell(tcs(t, 1)[1], "Nguồn số 05: Nước thải từ hệ thống xử lý khí thải lò hơi than (vận hành luân phiên Thứ Bảy, Chủ Nhật hàng tuần), lưu lượng ước tính khoảng 2 m³/tuần (*); đồng thời phát sinh nước xả đáy, xả bề mặt của lò hơi sinh khối (vận hành các ngày trong tuần), lưu lượng khoảng 4,3 m³/ngày. Nước thải được thu gom về hệ thống xử lý nước thải tập trung công suất 120 m³/ngày đêm.")
set_reason(tcs(t, 2)[0], "Bổ sung lò hơi sinh khối vận hành luân phiên với lò than hiện hữu theo lịch cố định hàng tuần (không vận hành đồng thời); hệ thống xử lý khí thải ướt của lò than tiếp tục hoạt động khi lò than vận hành, với tần suất và lưu lượng giảm tương ứng tỷ lệ ngày vận hành. Dòng nước thải, vị trí xả, lưu lượng xả lớn nhất và giá trị giới hạn cho phép của các chất ô nhiễm không thay đổi.")
t = T[9]
set_cell(tcs(t, 1)[1], "Nguồn số 01: Bụi, khí thải phát sinh từ 02 lò hơi vận hành luân phiên, không đồng thời: (i) lò hơi tầng sôi ống nước đốt nhiên liệu sinh khối (củi băm, viên nén gỗ, mùn cưa, trấu rời, vỏ mắc ca…), công suất 6.000 kg hơi/giờ, vận hành các ngày trong tuần; (ii) lò hơi đốt than hiện hữu, công suất 8 tấn hơi/giờ, vận hành luân phiên vào Thứ Bảy, Chủ Nhật hàng tuần.")
old = txt(cell_paras(tcs(t, 2)[0])[0]); old = old.replace("Công ty đầu tư thay thế bằng lò hơi tầng sôi ống nước đốt nhiên liệu sinh khối", "Công ty đầu tư bổ sung lò hơi tầng sôi ống nước đốt nhiên liệu sinh khối")
set_reason(tcs(t, 2)[0], old.replace("Lý do điều chỉnh: ", "").rstrip() + " Đồng thời giữ lại lò hơi than hiện hữu để vận hành luân phiên, bảo đảm cấp hơi liên tục cho sản xuất trong điều kiện nhân sự vận hành và nguồn cung nhiên liệu sinh khối không bố trí vào cuối tuần.")
t = T[10]
set_cell(tcs(t, 1)[1], "Bụi, khí thải phát sinh từ 02 lò hơi (sinh khối và than, vận hành luân phiên không đồng thời) được thu gom theo hai tuyến riêng biệt (xem Bảng 2.1) về hệ thống xử lý bụi, khí thải số 01. Khí thải sau khi xử lý thoát ra ngoài môi trường qua ống khói chung hiện hữu cao 18 m, đường kính D = 700 mm.")
set_reason(tcs(t, 2)[0], "Bổ sung tuyến thu gom, xử lý khô cho lò hơi sinh khối song song với tuyến xử lý ướt hiện hữu của lò than; hai tuyến không vận hành đồng thời. Tuyến ống thu gom, vị trí và kích thước ống khói không thay đổi.")
t = T[11]
set_cell(tcs(t, 1)[2], "Tuyến 1 (lò sinh khối): Khí thải → Cyclone chùm → Lọc bụi túi vải → Quạt hút mới (khống chế ≤ 25.000 m³/giờ) → Ống thải. Tuyến 2 (lò than, luân phiên): Khí thải → Lọc bụi ướt → Hấp thụ dung dịch kiềm → Quạt hút hiện hữu (25.000 m³/giờ) → Ống thải (giữ nguyên, KHÔNG ngừng sử dụng).")
set_cell(tcs(t, 2)[2], "NaOH — tiếp tục sử dụng khi lò than vận hành luân phiên, lượng dùng giảm còn ước tính 86 kg/tháng (*).")
set_reason(tcs(t, 3)[0], "Nhiên liệu sinh khối có hàm lượng lưu huỳnh rất thấp (khoảng 0,02%) nên khí thải lò sinh khối không cần công đoạn hấp thụ bằng dung dịch kiềm; bổ sung hệ thống lọc bụi khô hai cấp (cyclone chùm kết hợp lọc bụi túi vải) để xử lý triệt để tro bay của nhiên liệu sinh khối, hiệu suất xử lý bụi đạt trên 99%. Do lò than tiếp tục vận hành luân phiên vào cuối tuần, hệ thống xử lý ướt và hấp thụ kiềm hiện hữu được giữ nguyên, không tháo dỡ; tần suất và lưu lượng nước thải phát sinh giảm tương ứng tỷ lệ ngày vận hành của lò than. Công suất hệ thống xử lý và lưu lượng xả lớn nhất không thay đổi.")
settext(P[142], "- Công trình, thiết bị phải vận hành thử nghiệm: Hệ thống xử lý bụi, khí thải của lò hơi tầng sôi đốt sinh khối (nguồn số 01), công suất 25.000 m³/giờ; đồng thời kiểm tra hệ thống xử lý ướt của lò hơi than khi vận hành luân phiên.")
clone_after(P[146], P[146], "- Do hai lò hơi vận hành luân phiên không đồng thời, kế hoạch vận hành thử nghiệm bao gồm lấy mẫu đại diện cho cả hai chế độ vận hành: tối thiểu 03 mẫu đơn trong 03 ngày liên tiếp khi vận hành lò hơi sinh khối (ngày thường), và tối thiểu 01 đợt lấy mẫu bổ sung khi vận hành lò hơi than (cuối tuần), để xác nhận khí thải đạt quy chuẩn ở cả hai chế độ. Quan trắc định kỳ 03 tháng/lần sau này luân phiên lấy mẫu vào các đợt rơi vào cuối tuần, tránh chỉ lấy mẫu chế độ sinh khối.")
t = T[12]
set_cell(tcs(t, 1)[2], "≈ 25,5 tấn/tháng (*)")
set_reason(tcs(t, 4)[0], "Lò than hiện hữu được giữ lại, vận hành luân phiên vào cuối tuần nên vẫn phát sinh xỉ than, với khối lượng giảm tương ứng tỷ lệ ngày vận hành (≈ 2/7 so với vận hành liên tục); bổ sung tro, xỉ từ nhiên liệu sinh khối. Công trình lưu giữ chất thải rắn công nghiệp thông thường không thay đổi so với Giấy phép môi trường đã được cấp.")
n3a = clone_after(P[160], P[160], "3a. Công ty cam kết lò hơi đốt than hiện hữu (8 tấn hơi/giờ) và lò hơi tầng sôi đốt sinh khối (6.000 kg hơi/giờ) không vận hành đồng thời; lò than chỉ vận hành luân phiên theo lịch cố định (Thứ Bảy, Chủ Nhật hàng tuần) hoặc khi lò sinh khối gặp sự cố, bảo đảm bụi, khí thải phát sinh từ cả hai chế độ vận hành đều đạt QCVN 19:2009/BTNMT, giá trị Cmax, cột B, Kp = 0,8; Kv = 1,0 trước khi xả ra môi trường.")
clone_after(n3a, P[160], "3b. Công ty cam kết duy trì, vận hành đầy đủ hệ thống xử lý bụi, khí thải ướt (lọc bụi ướt, tháp hấp thụ dung dịch kiềm) hiện hữu của lò hơi than song song với hệ thống xử lý khô (cyclone chùm, lọc bụi túi vải) của lò hơi sinh khối, không tháo dỡ bất kỳ công trình nào.")

# ═════════ 6. Trang ghi chú nội bộ ═════════
settext(P[170], "☑ A1. ĐÃ CHỐT (trao đổi 19–20/11/2026): lò hơi 6 t/h sinh khối chạy chính (Thứ Hai – Thứ Sáu), lò hơi than 8 t/h giữ lại vận hành luân phiên cuối tuần (không đồng thời, dùng chung ống khói hiện hữu). Cần văn bản chốt chính thức của Ban Giám đốc trước khi trình ký.")
settext(P[172], "☐ A3. Hệ thống xử lý bụi lò sinh khối: cyclone chùm + LỌC BỤI TÚI VẢI (khô); lò than giữ nguyên lọc bụi ướt + hấp thụ kiềm. Cần xác nhận: (i) gói thầu IB2600448600 có bao gồm lọc bụi túi vải không, hay chỉ có cyclone đồng bộ theo lò; (ii) nếu không có thì Nhà máy phải đầu tư riêng – lập giấy đề nghị bổ sung.")
settext(P[188], "☐ C7. Kế hoạch giảm nhẹ phát thải KNK 2026–2030: với lò than chạy luân phiên (1.225 tấn than/năm (*)), mức giảm còn khoảng 8.030 tCO₂/năm (không còn 11.250 tCO₂/năm), vẫn lớn hơn mục tiêu 10% so với BAU (3.970 tCO₂e lũy kế). Phải cập nhật lại kịch bản BAU và kế hoạch giảm nhẹ; xác định rõ năm gốc để tránh tính trùng với phần sinh khối đã đốt ở lò sấy. Chuyển nội dung này cho người phụ trách kiểm kê KNK.")
replace_in(P[189], "Dự án thay thế lò hơi than bằng lò hơi sinh khối", "Dự án bổ sung lò hơi sinh khối làm lò chính (than đá giảm còn ≈ 1.225 tấn/năm (*))")
settext(P[191], "☑ C10. ĐÃ CHỐT: thiết bị lọc bụi ướt và tháp hấp thụ hiện hữu được giữ nguyên, vận hành luân phiên cùng lò than (không cô lập, không tháo dỡ).")
last = P[197]
extra = [
    "E. NỘI DUNG MỚI SAU KHI BỔ SUNG MÔ HÌNH GAUSS VÀ CHẾ ĐỘ LUÂN PHIÊN (20–24/11/2026)",
    "☐ E1. Cân bằng nhiệt: lò sinh khối 6.600 tấn/năm (nhiệt hữu ích ≈ 92.800 GJ/năm) cộng lò than 1.225 tấn/năm (≈ 26.200 GJ/năm) cho tổng ≈ 119.000 GJ/năm, lớn hơn nhu cầu 91.549 GJ/năm tính ở Mục 1.4 (+ 30%). Nếu giữ than 1.225 tấn/năm thì lượng sinh khối cần khoảng 4.650 tấn/năm. Phải rà lại số giờ chạy, hiệu suất và phụ tải hơi trước khi chốt 6.600 tấn/năm.",
    "☐ E2. Mô hình Gauss (mục 2.2.2.d): CO của lò sinh khối chưa có số liệu nhà cung cấp; kịch bản lò than xả bằng giới hạn NOₓ + nền tỉnh cận trên cho tổng NO₂ vượt 200 μg/m³ — cần quan trắc không khí xung quanh của Nhà máy (≥ 02 vị trí) làm nồng độ nền chính thức, thay giá trị tham khảo của tỉnh (chưa có phiếu gốc).",
    "☐ E3. Cung cấp khoảng cách và hướng tới khu dân cư gần nhất, chiều cao/bề rộng nhà xưởng cạnh ống khói (kiểm tra chiều cao GEP và cuốn xuống) để hoàn thiện đánh giá; cân nhắc chạy AERMOD với số liệu khí tượng trạm đại diện.",
    "☐ E4. Các giá trị đánh dấu (*) (than 1.225 tấn/năm; NaOH 86 kg/tháng; nước thải 2 m³/tuần; xỉ than 25,5 tấn/tháng) ước tính theo tỷ lệ 2/7 ngày vận hành — thay bằng số đo trong vận hành thử nghiệm.",
]
cur2 = last
for i, s in enumerate(extra):
    n = copy.deepcopy(P[192] if i == 0 else P[193]); settext(n, s); cur2.addnext(n); cur2 = n

d.save(OUT); print("saved", OUT)
