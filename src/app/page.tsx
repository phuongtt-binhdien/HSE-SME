"use client";
import dynamic from "next/dynamic";

// Render chỉ phía client: app hiển thị giờ/ngày hiện tại nên không prerender lúc build (tránh lỗi hydration)
const HSEApp = dynamic(() => import("./HSEApp"), { ssr: false });

export default function Page() {
  return <HSEApp />;
}
