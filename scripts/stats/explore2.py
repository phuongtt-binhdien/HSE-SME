import openpyxl, collections, re
D='/tmp/claude-0/-home-user-HSE-SME/622361c8-0cc5-5502-acfe-f0c7605b0628/scratchpad/xls/'
num=lambda v: float(v) if isinstance(v,(int,float)) and not isinstance(v,bool) else 0.0
for m in ['04','08']:
    wb=openpyxl.load_workbook(D+f'm{m}.xlsx',data_only=True); ws=wb['TK TAOHAT']
    hdr=284
    H={c:str(ws.cell(hdr,c).value).replace('\n',' ').strip() for c in range(1,ws.max_column+1) if ws.cell(hdr,c).value}
    tot=collections.Counter(); loai=collections.Counter(); prod=0
    for r in range(hdr+1,ws.max_row+1):
        if not isinstance(ws.cell(r,3).value,(int,float)): continue
        loai[ws.cell(r,9).value]+=num(ws.cell(r,10).value)
        for c in range(31,60): tot[H.get(c,c)]+=num(ws.cell(r,c).value)
    print(m, {k:round(v) for k,v in tot.items() if v})
    print(loai)
    # trial columns
    for r in range(hdr+1,ws.max_row+1):
        if not isinstance(ws.cell(r,3).value,(int,float)): continue
        y,aa,ab,ac=[num(ws.cell(r,c).value) for c in (25,27,28,29)]
        if y or aa or ab or ac: print(m,'day',ws.cell(r,3).value,'ca',ws.cell(r,4).value,ws.cell(r,7).value,'macca',y,'vn+tc kg',aa,'vn banh',ab,'tc banh',ac, 'than lo',ws.cell(r,14).value,'M',ws.cell(r,13).value)
