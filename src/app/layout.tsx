import type { Metadata } from "next";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "시니어 잡매칭",
  description: "시니어를 위한 AI 자동 매칭 일자리 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <Nav />
        <main className="mx-auto max-w-page px-4 py-8 md:px-6">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-500">
          © 2026 시니어 잡매칭 · 데모 프로젝트
        </footer>
      </body>
    </html>
  );
}
