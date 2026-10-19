// In biểu mẫu (biên bản, phiếu kiểm tra) qua hộp thoại in của trình duyệt – khổ A4, Times New Roman,
// lưu thành PDF hoặc in ra giấy để ký.

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** Dòng chấm khi chưa có dữ liệu để ghi tay */
export const blank = (v: unknown, dots = 30) => (v === null || v === undefined || v === '' ? '.'.repeat(dots) : esc(v))

/** Đầu văn bản: tên đơn vị (trái) – quốc hiệu, tiêu ngữ (phải) */
export function docHeader(org: string, unit: string) {
  return `<table class="hdr"><tr>
    <td><div>${esc(org.toUpperCase())}</div><b>${esc(unit.toUpperCase())}</b></td>
    <td><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><div><u>Độc lập – Tự do – Hạnh phúc</u></div></td>
  </tr></table>`
}

export function signBlock(titles: string[]) {
  return `<table class="sign"><tr>${titles.map((t) => `<td><b>${esc(t)}</b><br><i>(Ký, ghi rõ họ tên)</i></td>`).join('')}</tr></table>`
}

export function printDocument(title: string, bodyHtml: string) {
  const w = window.open('', '_blank', 'width=900,height=1000')
  if (!w) throw new Error('Trình duyệt đang chặn cửa sổ in – cho phép cửa sổ bật lên rồi thử lại.')
  w.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    @page { size: A4; margin: 20mm 15mm 20mm 25mm; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; color: #000; line-height: 1.45; margin: 0; }
    table { width: 100%; border-collapse: collapse; }
    .hdr td { width: 50%; text-align: center; vertical-align: top; font-size: 12pt; border: 0; }
    h1 { text-align: center; font-size: 14pt; margin: 22px 0 2px; text-transform: uppercase; }
    .sub { text-align: center; font-style: italic; margin-bottom: 14px; }
    .grid td, .grid th { border: 1px solid #000; padding: 4px 6px; vertical-align: top; font-size: 12pt; text-align: left; }
    .grid th { background: #eee; }
    p { margin: 6px 0; text-align: justify; }
    .sign { margin-top: 30px; }
    .sign td { text-align: center; vertical-align: top; border: 0; padding-bottom: 70px; }
    .muted { color: #444; font-size: 11pt; }
    @media print { .noprint { display: none; } }
  </style></head><body>${bodyHtml}<script>window.onload=function(){setTimeout(function(){window.print()},150)}</script></body></html>`)
  w.document.close()
}
