"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import UploadArea from "@/components/UploadArea";
import PDFViewer from "@/components/PDFViewer";
import RightPanel from "@/components/RightPanel";
import { useRef, useState } from "react";
import { DroppedAnnotation } from "@/components/types";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { saveAs } from "file-saver";

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [dropped, setDropped] = useState<DroppedAnnotation[]>([]);
  const [renderedSizes, setRenderedSizes] = useState<Record<number, { width: number; height: number }>>({});
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const [isPdfReady, setIsPdfReady] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  async function uploadPdfToBackend(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/pdf/upload`, {
        method: "POST",
        // 게스트/로그인 규칙: Authorization은 로그인 사용자일 때만 설정
        headers: (() => {
          const headers: Record<string, string> = {};
          try {
            const { auth } = require("@/lib/auth");
            const token = auth.getAccessToken?.();
            if (token) headers["Authorization"] = `Bearer ${token}`;
          } catch (_) {}
          return headers;
        })(),
        body: formData,
      });
      const text = await res.text();
      const data = JSON.parse(text);
      if (data.status === "ready") {
        setIsPdfReady(true);
      }
    } catch (e) {
      alert("PDF 업로드 실패");
    }
  }

  async function handleSaveWithAnnotations() {
    if (!pdfFile) return;

    const existingPdfBytes = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);
    const fontBytes = await fetch("/fonts/MaruBuri-Bold.ttf").then((res) => res.arrayBuffer());
    const customFont = await pdfDoc.embedFont(fontBytes);

    const pages = pdfDoc.getPages();
    for (const annotation of dropped) {
      const page = pages[annotation.pageNumber - 1];
      const rendered = renderedSizes[annotation.pageNumber];
      if (!rendered) continue;

      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      const scaledX = (annotation.x / rendered.width) * pageWidth;
      const scaledY = pageHeight - (annotation.y / rendered.height) * pageHeight;
      const textColor =
        annotation.answerState === 0
          ? rgb(1, 0, 0)
          : annotation.answerState === 2
          ? rgb(0.2, 0.4, 0.9)
          : rgb(1, 0.6, 0);

      try {
        const parsed = JSON.parse(annotation.text);
        const lines = parsed.lines ?? parsed.refinedText?.split("\n") ?? [parsed.refinedText];
        lines.forEach((line: string, i: number) => {
          page.drawText(line, {
            x: scaledX,
            y: scaledY - i * 12,
            size: 12,
            font: customFont,
            color: textColor,
            maxWidth: annotation.width,
          });
        });
      } catch {
        page.drawText(annotation.text, {
          x: scaledX,
          y: scaledY,
          size: 12,
          font: customFont,
          color: textColor,
        });
      }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    saveAs(blob, "annotated.pdf");
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
<Header fileName={pdfFile?.name} />
        <main className="flex flex-1 h-0">
          {!pdfFile ? (
            <UploadArea />
          ) : !isPdfReady ? (
            <div className="w-full flex items-center justify-center text-gray-600 text-3xl animate-pulse">
              ⏳ PDF 분석 중입니다...
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <PDFViewer
                  dropped={dropped}
                  setDropped={setDropped}
                  file={pdfFile}
                  containerWidth={containerWidth}
                  setContainerWidth={setContainerWidth}
                  setRenderedSizes={setRenderedSizes}
                />
              </div>
              <div className="w-[400px] h-full overflow-y-auto border-l border-gray-200">
              <RightPanel
                dropped={dropped}
                renderedSizes={renderedSizes}
                pdfFile={pdfFile}
                handleSaveWithAnnotations={handleSaveWithAnnotations}
/>              
</div>
            </>
          )}
        </main>
        {/* 파일 업로드 input은 숨겨놓고 트리거만 노출 */}
        <input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setPdfFile(file);
              setIsPdfReady(false);
              uploadPdfToBackend(file);
            }
          }}
        />
      </div>
    </div>
  );
}
