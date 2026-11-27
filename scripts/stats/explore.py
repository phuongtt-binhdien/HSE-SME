import openpyxl, sys, re, collections
D='/tmp/claude-0/-home-user-HSE-SME/622361c8-0cc5-5502-acfe-f0c7605b0628/scratchpad/xls/'
def num(v):
    return float(v) if isinstance(v,(int,float)) and not isinstance(v,bool) else None
for m in ['04','05','06','07','08']:
    wb=openpyxl.load_workbook(D+f'm{m}.xlsx',data_only=True)
    ws=wb['TK TAOHAT']
    hdr=next(r for r in range(1,ws.max_row+1) if str(ws.cell(r,3).value).strip()=='NGÀY' and str(ws.cell(r,10).value).strip()=='SẢN LƯỢNG')
    col={str(ws.cell(hdr,c).value).replace('\n',' ').strip():c for c in range(1,ws.max_column+1) if ws.cell(hdr,c).value}
    runs=collections.defaultdict(lambda:[0,0.0,0.0,0.0,0.0,0.0])
    days=set(); n=0
    for r in range(hdr+1,ws.max_row+1):
        d=ws.cell(r,3).value
        if not isinstance(d,(int,float)): continue
        n+=1; days.add(int(d))
        mach=ws.cell(r,7).value
        bags=num(ws.cell(r,11).value) or 0; tg=num(ws.cell(r,13).value) or 0
        if tg:
            a=runs[mach]; a[0]+=1; a[1]+=tg; a[2]+=bags*50/1000; a[3]+=num(ws.cell(r,14).value) or 0; a[4]+=num(ws.cell(r,15).value) or 0; a[5]+=num(ws.cell(r,18).value) or 0
    print(m,'hdr',hdr,'rows',n,'days',min(days),max(days),len(days))
    for k,v in sorted(runs.items(),key=lambda x:str(x[0])): print('  ',k,'runs',v[0],'hours',round(v[1],1),'t',round(v[2]),'coalLo kg',round(v[3]),'coalNoi kg',round(v[4]),'kWh',round(v[5]))
