#!/usr/bin/env python3
"""Đọc 5 file THONG_KE_NGUYEN_LIEU_THANG_04…08.2026.xls (đã đổi sang .xlsx bằng LibreOffice) → JSON tổng hợp cho App.
Dùng: python3 scripts/stats/parse_stats.py <thư mục chứa m04.xlsx … m08.xlsx> <file.json>
Quy ước đọc dữ liệu (xem README):
 - SẢN LƯỢNG là số bao; khối lượng bao lấy từ cột LOẠI SP (…50KG, 25KG, 20 KG; mặc định 50 kg).
 - HỆ MÁY TH1H/TH2H/TH3H = máy 1/2/3. Máy 2 = tạo hạt 3 theo GPMT (người dùng xác nhận).
 - Sinh khối: cột VỎ MẮC CA (bành), VIÊN NÉN (bành), VIÊN NÉN + THAN CỦI (kg) – chỉ lấy cột kg.
 - Số liệu điện = hiệu hai số công tơ × hệ số (cột TH ĐIỆN); dòng lỗi công tơ (âm / thiếu số cuối) bị loại và ghi chú."""
import sys, re, json, collections, openpyxl
src, out = sys.argv[1], sys.argv[2]
num = lambda v: float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else 0.0
isnum = lambda v: isinstance(v, (int, float)) and not isinstance(v, bool)
def kg(loai):
    m = re.search(r'(\d+)\s*KG', str(loai or '').upper()); return int(m.group(1)) if m else 50
def clean(s): return re.sub(r'\s+', ' ', str(s or '')).strip()
def hdr_row(ws, key_col, key, sl_col):
    for r in range(1, ws.max_row + 1):
        if clean(ws.cell(r, key_col).value).upper() == key and 'SẢN LƯỢNG' in clean(ws.cell(r, sl_col).value).upper(): return r
    raise SystemExit('không tìm thấy dòng tiêu đề')
def cols(ws, h):
    d = {}
    for c in range(1, ws.max_column + 1):
        v = ws.cell(h, c).value
        if v not in (None, ''): d.setdefault(clean(v).upper(), c)   # tên lặp: lấy cột đầu tiên
    return d
RAW = ['MAP','DAP  18-46   LAO CAI','UR EA','NP','S A','KCL HẠT','KCL LÀO','KCL ĐỎ','K CL TR','K2 S O4','CLANH','NPK 16.16.8','VI LG ĐT','PE NAC','SETPENTIN','K2MGSO4','SILICATE','DOLOMIT','CAN-XI','BO','ZN','SI LI CON','KIESERITE']
RAW_NAMES = {'MAP':'MAP','DAP  18-46   LAO CAI':'DAP 18-46 Lào Cai','UR EA':'Urê','NP':'NP','S A':'SA','KCL HẠT':'KCl hạt','KCL LÀO':'KCl Lào','KCL ĐỎ':'KCl đỏ','K CL TR':'KCl trắng','K2 S O4':'K₂SO₄','CLANH':'Clanh (Clinker/đệm)','NPK 16.16.8':'NPK 16-16-8','VI LG ĐT':'Vi lượng ĐT','PE NAC':'Penac','SETPENTIN':'Serpentin','K2MGSO4':'K₂MgSO₄','SILICATE':'Silicate','DOLOMIT':'Dolomit','CAN-XI':'Canxi','BO':'Bo','ZN':'Zn','SI LI CON':'Silicon','KIESERITE':'Kieserite'}
res = {'months': [], 'granulation': {}, 'notes': []}
tot_raw = {}
for m in ['04','05','06','07','08']:
    wb = openpyxl.load_workbook(f'{src}/m{m}.xlsx', data_only=True)
    ws = wb['TK TAOHAT']; h = hdr_row(ws, 3, 'NGÀY', 10); C = cols(ws, h)
    g = lambda r, k: ws.cell(r, C[k]).value
    machines = collections.defaultdict(lambda: {'ca':0,'hours':0.0,'downH':0.0,'tons':0.0,'coalLoKg':0.0,'coalNoiKg':0.0,'kWh':0.0,'kWhRuns':0,'biomassKg':0.0,'biomassRuns':0,'maccaBanh':0.0,'vienNenBanh':0.0,'products':collections.Counter()})
    daily = collections.defaultdict(lambda: collections.defaultdict(lambda: {'h':0.0,'t':0.0,'bio':0.0,'coal':0.0}))
    raw = collections.Counter(); bad = []
    for r in range(h + 1, ws.max_row + 1):
        day = ws.cell(r, 3).value
        if not isnum(day): continue
        day = int(day); mach = clean(g(r, 'HỆ MÁY')); mm = machines[mach]
        loai = g(r, 'LOẠI SP'); t = num(g(r, 'SẢN LƯỢNG')) * kg(loai) / 1000
        mm['tons'] += t; mm['products'][clean(g(r, 'SẢN PHẨM'))] += t; daily[mach][day]['t'] += t
        for k in RAW:
            if k in C: raw[k] += num(ws.cell(r, C[k]).value) * 50 / 1000   # bao 50 kg → tấn
        tg = g(r, 'TG CHẠY MÁY')
        if isnum(tg) and tg > 0:      # dòng "chạy máy" của một ca
            mm['ca'] += 1; mm['hours'] += tg; mm['downH'] += num(g(r, 'TG HƯ HỎNG'))
            lo, noi = num(g(r, 'THAN LÒ ĐỐT')), num(g(r, 'THAN NỒI HƠI')); mm['coalLoKg'] += lo; mm['coalNoiKg'] += noi
            bio = num(g(r, 'VIÊN NÉN + THAN CỦI ( KG)')); mm['biomassKg'] += bio; mm['biomassRuns'] += 1 if bio > 0 else 0
            mm['maccaBanh'] += num(g(r, 'VỎ MẮC CA')); mm['vienNenBanh'] += num(g(r, 'VIÊN NÉN ( BÀNH )'))
            p, q, e = g(r, 'ĐIỆN ĐẦU'), g(r, 'ĐIỆN CUỐI'), g(r, 'TH ĐIỆN')
            if isnum(e) and e >= 0 and isnum(q): mm['kWh'] += e; mm['kWhRuns'] += 1
            else: bad.append(f'{m}/2026 ngày {day} {mach}: công tơ điện thiếu/sai (đầu {p}, cuối {q}, TH điện {e}) — loại khỏi tổng điện')
            d = daily[mach][day]; d['h'] += tg; d['bio'] += bio; d['coal'] += lo
    res['granulation'][m] = {
        'machines': {k: {kk: (round(vv, 2) if isinstance(vv, float) else vv) for kk, vv in v.items() if kk != 'products'} | {'topProducts': [[n, round(t, 1)] for n, t in v['products'].most_common(6)]} for k, v in machines.items()},
        'daily': {k: {str(d): {a: round(b, 2) for a, b in x.items()} for d, x in sorted(v.items())} for k, v in daily.items()},
        'rawTons': {RAW_NAMES[k]: round(v, 1) for k, v in raw.items() if v},
    }
    res['notes'] += bad
    # trộn, XLNL, đóng gói: tổng theo tháng
    other = {}
    for name, keyc in [('TK TRON', 'HỆ MÁY'), ('TK XLNL', 'HỆ SX')]:
        if name not in wb.sheetnames:
            res['notes'].append(f'{m}/2026: không có sheet {name}'); continue
        ws2 = wb[name]; h2 = next(r for r in range(1, ws2.max_row + 1) if clean(ws2.cell(r, 3).value).upper() == 'NGÀY' and 'SẢN LƯỢNG' in clean(ws2.cell(r, 10).value).upper()); C2 = cols(ws2, h2)
        agg = collections.defaultdict(lambda: {'tons': 0.0, 'hours': 0.0, 'kWh': 0.0, 'ca': 0, 'coalKg': 0.0})
        for r in range(h2 + 1, ws2.max_row + 1):
            if not isnum(ws2.cell(r, 3).value): continue
            k = clean(ws2.cell(r, C2[keyc]).value) or '?'; a = agg[k]
            a['tons'] += num(ws2.cell(r, C2['SẢN LƯỢNG ( BAO)' if name == 'TK XLNL' else 'SẢN LƯỢNG']).value) * kg(ws2.cell(r, C2['LOẠI SP']).value) / 1000
            tgk = 'TG CHẠY MÁY'; tg = ws2.cell(r, C2[tgk]).value
            if isnum(tg) and tg > 0:
                a['hours'] += tg; a['ca'] += 1
                e = ws2.cell(r, C2['TH ĐIỆN']).value; a['kWh'] += e if isnum(e) and e >= 0 else 0
                a['coalKg'] += num(ws2.cell(r, C2.get('THAN NỒI HƠI', 0) or 1).value) if 'THAN NỒI HƠI' in C2 else 0
        other[name] = {k: {a: round(b, 1) for a, b in v.items()} for k, v in agg.items()}
    pk = collections.Counter()
    pname = next((n for n in ('TK ĐONG GOI CHINH', 'TK ĐONG GOI TT') if n in wb.sheetnames), None)
    if pname:
        ws3 = wb[pname]
        h3 = next((r for r in range(1, ws3.max_row + 1) if clean(ws3.cell(r, 2).value).upper() == 'NGÀY' and 'SẢN LƯỢNG' in clean(ws3.cell(r, 10).value).upper()), None)
        if h3:
            for r in range(h3 + 1, ws3.max_row + 1):
                if isnum(ws3.cell(r, 2).value): pk[clean(ws3.cell(r, 9).value)] += num(ws3.cell(r, 10).value) * kg(ws3.cell(r, 9).value) / 1000
        else: res['notes'].append(f'{m}/2026: sheet {pname} khác cấu trúc — bỏ qua đóng gói')
    other['packing'] = {k: round(v, 1) for k, v in pk.items() if v}
    res['granulation'][m]['other'] = other
json.dump(res, open(out, 'w'), ensure_ascii=False, indent=1)
for m, v in res['granulation'].items():
    print(m, {k: (x['ca'], x['hours'], round(x['tons']), round(x['biomassKg'])) for k, x in v['machines'].items()}, {k: round(x['tons']) for k, x in v['other'].get('TK TRON', {}).items()}, round(sum(v['other']['packing'].values())))
print(res['notes'])
