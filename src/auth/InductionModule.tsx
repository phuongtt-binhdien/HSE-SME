"use client";
// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext.tsx";
import { errText } from "./api.ts";
import { Card, Btn, Msg, C, fmtDate } from "./ui.tsx";

// Nội dung huấn luyện an ninh – an toàn khi vào nhà máy. Dựa trên nội quy PCCC (QĐ 759/QĐ.KS-BĐ), QĐ 199/QĐ.KS-BĐ, Biện pháp UPSCHC 2026 và quy tắc thông dụng.
// Đây là nội dung mẫu: cán bộ ATVSLĐ/PCCC của nhà máy cần rà soát, bổ sung điểm tập kết, số điện thoại khẩn cấp và quy định riêng trước khi áp dụng chính thức.
export const SECTIONS = [
  { id: "an_ninh", icon: "🛂", title: "1. An ninh – đăng ký ra vào", items: ["Mọi khách, nhà thầu, tài xế phải đăng ký tại cổng/bảo vệ, xuất trình giấy tờ cần thiết và nhận thẻ ra vào; đeo thẻ trong suốt thời gian ở nhà máy.", "Đi cùng người dẫn đường của nhà máy; không tự ý vào khu vực không được phép (khu sản xuất, kho hóa chất, kho NH₃, phòng điều khiển, trạm điện).", "Không quay phim, chụp ảnh khi chưa được người quản lý khu vực đồng ý.", "Phương tiện chạy đúng tốc độ quy định, đỗ đúng nơi, nhường xe nâng và xe tải đang bốc xếp.", "Nhà thầu/khách ký cam kết bảo vệ môi trường, an toàn và PCCC khi làm việc trong khuôn viên nhà máy."] },
  { id: "ppe", icon: "🦺", title: "2. Bảo hộ cá nhân và đi lại trong xưởng", items: ["Bắt buộc mũ bảo hộ, giày bảo hộ khi vào khu sản xuất; thêm kính, găng, khẩu trang chống bụi, nút tai theo biển báo từng khu vực.", "Không mặc đồ rộng, đeo dây chuyền, để tóc dài thả tự do gần thiết bị quay.", "Chỉ đi trên lối dành cho người đi bộ; không đi tắt dưới băng tải, không leo trèo thiết bị, không đứng trong tầm hoạt động của xe nâng.", "Ở khu vực bụi và ồn (thùng sấy, quạt, máy nghiền, đóng bao) thực hiện đúng yêu cầu bảo hộ; không tháo khẩu trang khi chưa ra khỏi khu vực.", "Không ăn uống, hút thuốc trong khu sản xuất và kho; chỉ dùng khu vực quy định."] },
  { id: "pccc", icon: "🔥", title: "3. Phòng cháy chữa cháy và cứu nạn", items: ["Không hút thuốc, không mang nguồn lửa vào khu sản xuất và kho (theo nội quy PCCC của nhà máy).", "Hàn, cắt, mài tạo tia lửa chỉ được thực hiện khi có phép làm việc nóng và người giám sát an toàn; kiểm tra khu vực sau khi kết thúc.", "Nhận biết vị trí bình chữa cháy, họng nước, lối thoát hiểm, còi/chuông báo cháy gần nơi bạn làm việc.", "Khi phát hiện cháy: hô to, báo ngay người phụ trách/bộ phận PCCC, nhấn chuông báo cháy; chỉ chữa cháy khi an toàn và đã được hướng dẫn; ưu tiên cứu người.", "Khi có lệnh sơ tán: ngừng việc, đi theo lối thoát hiểm đến điểm tập kết, không dùng thang máy, không quay lại lấy đồ, chờ điểm danh."] },
  { id: "hoa_chat", icon: "⚗️", title: "4. Hóa chất và khí độc (NH₃, axit)", items: ["Nhà máy có NH₃ (độc cấp tính, ăn mòn), axit sunfuric/clohydric/nitric, NaOH (nhóm 8 – ăn mòn), phụ gia và vi lượng; chỉ người được huấn luyện mới thao tác hóa chất.", "Đọc nhãn, biển cảnh báo và bảng dữ liệu an toàn (SDS); không sang chiết, không trộn hóa chất khi chưa được hướng dẫn.", "Ngửi thấy mùi khai nồng hoặc thấy rò rỉ: báo ngay, ra khỏi khu vực theo hướng thoáng/ngược gió, cảnh báo người xung quanh, không tự xử lý.", "Hóa chất tràn đổ: tránh xa, báo bộ phận phụ trách, không đổ ra cống; chỉ lực lượng ứng phó được huấn luyện mới xử lý.", "Khi dính hóa chất vào da/mắt: rửa ngay bằng nhiều nước sạch tại vòi rửa mắt/khẩn cấp và báo cho người phụ trách để được cấp cứu."] },
  { id: "thiet_bi", icon: "⚙️", title: "5. Thiết bị quay, nóng, điện và nâng hạ", items: ["Thùng sấy, thùng tạo hạt, quạt, băng tải, máy nghiền, lò đốt là thiết bị quay hoặc nóng: giữ khoảng cách, không chạm, không mở nắp che chắn khi đang chạy.", "Thiết bị đang sửa chữa phải được khóa – gắn thẻ nguồn năng lượng; không vận hành khi có biển cấm; không tự ý tháo biển.", "Bề mặt lò đốt, ống dẫn khí nóng, ống hơi và thùng sấy rất nóng; không dựa, chạm hoặc để vật dễ cháy gần.", "Cầu trục, thang nâng, xe nâng: không đứng dưới tải, không vào vùng nguy hiểm khi đang vận hành, tuân thủ hiệu lệnh của người điều khiển.", "Tủ điện và dây điện: không chạm, không đưa vật dẫn điện lại gần, không dùng nước chữa cháy lên thiết bị đang có điện."] },
  { id: "moi_truong", icon: "🌿", title: "6. Môi trường, sự cố và báo cáo", items: ["Phân loại rác tại nguồn (sinh hoạt, công nghiệp, nguy hại); bỏ đúng thùng, không vứt chất thải nguy hại (giẻ dính dầu, bóng đèn, pin) vào rác thường.", "Không xả nước, dầu, hóa chất ra mương, cống và sông Vàm Cỏ Đông; không đốt rác trong khuôn viên.", "Tiết kiệm điện, nước; tắt thiết bị khi không dùng.", "Mọi sự cố, suýt xảy ra tai nạn, tai nạn lao động phải báo ngay cho người phụ trách — không giấu, không tự khắc phục khi chưa an toàn.", "Khi thấy tình huống nguy hiểm: dừng việc, báo ngay; nút dừng khẩn cấp chỉ dùng khi được huấn luyện và an toàn để thực hiện."] },
];

export function InductionModule({ setActive }) {
  const a = useAuth(); const valid = a.me.induction;
  const [run, setRun] = useState(null); const [now, setNow] = useState(0); const [open, setOpen] = useState(0); const seen = useRef(new Set([0]));
  const [qs, setQs] = useState([]); const [ans, setAns] = useState({}); const [res, setRes] = useState(null); const [err, setErr] = useState(""); const off = useRef(0);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const start = async () => { setErr(""); setRes(null); try { const r = await a.api.inductionStart(); off.current = new Date(r.now).getTime() - Date.now(); setRun({ id: r.attempt_id, start: new Date(r.started_at).getTime(), need: r.required_seconds }); setQs(await a.api.questions()); setOpen(0); seen.current = new Set([0]); setAns({}); } catch (e) { setErr(errText(e)); } };
  const elapsed = run ? Math.max(0, Math.floor((Date.now() + off.current - run.start) / 1000)) : 0; void now;
  const ready = run && elapsed >= run.need && seen.current.size >= SECTIONS.length;
  const submit = async () => { setErr(""); try { const r = await a.api.inductionSubmit(run.id, ans); setRes(r); if (r.passed) { setRun(null); await a.refreshMe(); } else setRun(null); } catch (e) { setErr(errText(e)); } };
  const mm = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const sec = SECTIONS[open];
  return <div style={{ display: "grid", gap: 14, maxWidth: 900 }}>
    <Card>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
        <div><div className="au-h" style={{ marginBottom: 4 }}>🦺 Huấn luyện an ninh – an toàn trước khi vào nhà máy</div><div style={{ color: C.sub, fontSize: 13, lineHeight: 1.7 }}>Thời lượng tối thiểu <b style={{ color: C.txt }}>15 phút</b> (đo bằng giờ máy chủ) và bài kiểm tra đạt từ 80 %. Bắt buộc trước khi mở <b style={{ color: C.txt }}>Mô phỏng 3D nhà máy</b> và là điều kiện để khách/nhà thầu được vào khu sản xuất.</div></div>
        {valid ? <div style={{ textAlign: "right" }}><div style={{ color: C.green, fontWeight: 700 }}>✔ Đã hoàn thành</div><div style={{ color: C.sub, fontSize: 12 }}>Điểm {valid.score}/{valid.total} · hiệu lực đến {fmtDate(valid.expires_at)}</div></div> : <div style={{ color: C.amber, fontWeight: 700 }}>Chưa hoàn thành</div>}
      </div>
      {valid && <div style={{ marginTop: 12, padding: 14, border: `1px solid ${C.green}55`, borderRadius: 10 }} id="induction-cert">
        <div style={{ fontWeight: 700 }}>GIẤY XÁC NHẬN HOÀN THÀNH HUẤN LUYỆN AN NINH – AN TOÀN</div>
        <div style={{ color: C.sub, fontSize: 12, marginTop: 4, lineHeight: 1.8 }}>Họ tên: <b style={{ color: C.txt }}>{a.me.profile?.full_name || a.me.email}</b> · Đơn vị: {a.me.profile?.company || "—"}<br />Hoàn thành: {fmtDate(valid.passed_at)} · Hiệu lực đến: {fmtDate(valid.expires_at)} · Điểm: {valid.score}/{valid.total}<br />Nhà máy Phân bón Bình Điền – Long An</div>
        <div style={{ marginTop: 8 }}><Btn onClick={() => window.print()}>🖨 In giấy xác nhận</Btn></div>
      </div>}
      {err && <div style={{ marginTop: 10 }}><Msg kind="err">{err}</Msg></div>}
      {!run && <div style={{ marginTop: 12 }}><Btn kind="pri" onClick={start}>{valid ? "Học lại / gia hạn" : "Bắt đầu huấn luyện"}</Btn></div>}
    </Card>
    {res && <Msg kind={res.passed ? "ok" : "err"}>{res.passed ? `Đạt: ${res.score}/${res.total} câu đúng. Bạn đã được xác nhận hoàn thành huấn luyện.` : `Chưa đạt: ${res.score}/${res.total} câu đúng (cần ≥ ${res.pass_pct} %). Hãy xem lại nội dung các câu ${res.wrong.join(", ")} rồi làm lại.`}</Msg>}
    {run && <>
      <Card><div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <div style={{ font: "800 22px 'DM Mono',monospace", color: elapsed >= run.need ? C.green : C.amber }} data-testid="timer">{mm(Math.min(elapsed, run.need))} / {mm(run.need)}</div>
        <div style={{ color: C.sub, fontSize: 12 }}>Đã xem {seen.current.size}/{SECTIONS.length} phần · cần đủ thời gian và đã xem hết các phần mới làm được bài kiểm tra</div></div>
        <div style={{ height: 6, background: "#0a1220", borderRadius: 4, marginTop: 8 }}><div style={{ height: 6, width: `${Math.min(100, elapsed / run.need * 100)}%`, background: C.green, borderRadius: 4 }} /></div></Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8 }}>{SECTIONS.map((s, i) => <Btn key={s.id} kind={i === open ? "pri" : ""} onClick={() => { setOpen(i); seen.current.add(i); }}>{seen.current.has(i) ? "✔ " : ""}{s.icon} {s.title}</Btn>)}</div>
      <Card title={`${sec.icon} ${sec.title}`}><ul style={{ margin: 0, paddingLeft: 20, color: C.txt, fontSize: 14, lineHeight: 1.9 }}>{sec.items.map((t, i) => <li key={i}>{t}</li>)}</ul>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>{open > 0 && <Btn onClick={() => { setOpen(open - 1); seen.current.add(open - 1); }}>← Trước</Btn>}{open < SECTIONS.length - 1 && <Btn kind="pri" onClick={() => { setOpen(open + 1); seen.current.add(open + 1); }}>Phần tiếp →</Btn>}</div></Card>
      <Card title={`Bài kiểm tra (${qs.length} câu)`}>
        {!ready && <Msg>Bài kiểm tra mở khi đủ {Math.round(run.need / 60)} phút và đã xem hết {SECTIONS.length} phần.</Msg>}
        {ready && <div style={{ display: "grid", gap: 14 }}>{qs.map(q => <div key={q.id}><div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{q.id}. {q.prompt}</div>{q.options.map((o, i) => <label key={i} style={{ display: "flex", gap: 8, padding: "4px 0", fontSize: 13, color: C.sub, cursor: "pointer" }}><input type="radio" name={`q${q.id}`} checked={ans[q.id] === i} onChange={() => setAns({ ...ans, [q.id]: i })} />{o}</label>)}</div>)}
          <Btn kind="pri" disabled={Object.keys(ans).length < qs.length} onClick={submit}>Nộp bài</Btn></div>}
      </Card>
    </>}
    <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.6 }}>Nội dung huấn luyện là bản mẫu tổng hợp từ nội quy PCCC, các quy định vận hành an toàn và biện pháp ứng phó sự cố hóa chất của nhà máy; cán bộ ATVSLĐ/PCCC cần rà soát và bổ sung (điểm tập kết, số khẩn cấp, quy định từng khu) trước khi áp dụng chính thức.</div>
  </div>;
}
