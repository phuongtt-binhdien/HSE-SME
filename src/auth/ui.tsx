// @ts-nocheck
import { useEffect } from "react";
export const C = { bg: "#05080f", card: "#0d1320", card2: "#111827", line: "#1d2d40", txt: "#e6edf7", sub: "#9fb0c6", dim: "#6b7f99", green: "#00e5a0", red: "#ff3860", amber: "#ffb020", blue: "#3b9eff", violet: "#8b5cf6" };
const CSS = `.au-btn{background:#16233a;color:${C.txt};border:1px solid ${C.line};border-radius:9px;padding:9px 14px;font:600 13px 'Outfit',system-ui;cursor:pointer}.au-btn:hover{background:#1e3050}.au-btn.pri{background:linear-gradient(135deg,#00b37e,#0a8f6e);border-color:#0a8f6e;color:#fff}.au-btn.dan{background:#7a2226;border-color:#c0392b}.au-btn[disabled]{opacity:.5;cursor:default}
.au-in{width:100%;background:#0a1220;color:${C.txt};border:1px solid ${C.line};border-radius:9px;padding:10px 12px;font:14px 'Outfit',system-ui}.au-in:focus{outline:2px solid #1f4e8c}
.au-card{background:${C.card};border:1px solid ${C.line};border-radius:14px;padding:16px;min-width:0}.au-h{font:700 15px 'Syne','Outfit',system-ui;color:${C.txt};margin-bottom:10px}
.au-tb{width:100%;border-collapse:collapse;font-size:12px}.au-tb th{text-align:left;color:${C.dim};font-size:10px;text-transform:uppercase;letter-spacing:.5px;padding:6px 8px}.au-tb td{padding:7px 8px;border-top:1px solid ${C.line}}`;
export function AuthStyle() { useEffect(() => { const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s); return () => s.remove(); }, []); return null; }
export const Btn = ({ children, kind = "", ...p }) => <button className={`au-btn ${kind}`} {...p}>{children}</button>;
export const Card = ({ title, children, style }) => <div className="au-card" style={style}>{title && <div className="au-h">{title}</div>}{children}</div>;
export const Msg = ({ kind = "info", children }) => children ? <div style={{ padding: "8px 12px", borderRadius: 9, fontSize: 12, lineHeight: 1.5, background: kind === "err" ? "#3a1218" : kind === "ok" ? "#0e2f25" : "#10243d", border: `1px solid ${kind === "err" ? "#7a2226" : kind === "ok" ? "#0a8f6e" : "#1f4e8c"}`, color: kind === "err" ? "#ffb4b4" : kind === "ok" ? "#9ff3d3" : "#bcd6ff" }}>{children}</div> : null;
export const fmtVnd = n => Number(n).toLocaleString("vi-VN") + "đ";
export const fmtDate = s => s ? new Date(s).toLocaleString("vi-VN", { hour12: false }) : "—";
