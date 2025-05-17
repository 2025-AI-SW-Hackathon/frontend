// Home.tsx
"use client";

import PDFViewer from "@/components/PDFViewer";
import AnnotationPanel from "@/components/AnnotationPanel";
import { useRef, useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { saveAs } from "file-saver";
import { DroppedAnnotation } from "@/components/types";

export default function Home() {
  const captureRef = useRef<HTMLDivElement>(null);
  const [dropped, setDropped] = useState<DroppedAnnotation[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600); // 임시 기본값

  async function handleSaveWithAnnotations(
    file: File,
    droppedAnnotations: DroppedAnnotation[],
    renderedWidth: number
  ) {
    const existingPdfBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);
    const fontBytes = await fetch("/fonts/MaruBuri-Bold.ttf").then((res) => res.arrayBuffer());
    const customFont = await pdfDoc.embedFont(fontBytes);

    const pages = pdfDoc.getPages();
    for (const annotation of droppedAnnotations) {
      const page = pages[annotation.pageNumber - 1];
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();

      const renderedHeight = (renderedWidth * pageHeight) / pageWidth;
      const scaledX = (annotation.x / renderedWidth) * pageWidth;
      const scaledY = pageHeight - (annotation.y / renderedHeight) * pageHeight;

      page.drawText(annotation.text, {
        x: scaledX,
        y: scaledY,
        size: 10,
        font: customFont,
        color: rgb(1, 0.6, 0),
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    saveAs(blob, "annotated.pdf");
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 flex gap-4 bg-white shadow z-10">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setPdfFile(file);
          }}
          className="hidden"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className="px-4 py-2 bg-gray-600 text-white rounded cursor-pointer"
        >
          PDF 업로드
        </label>
        <button className="px-4 py-2 bg-green-500 text-white rounded">녹음 시작</button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => {
            if (pdfFile) {
              handleSaveWithAnnotations(pdfFile, dropped, containerWidth);
            } else {
              alert("PDF 파일을 먼저 업로드하세요.");
            }
          }}
        >
          PDF 다운로드
        </button>
      </div>
      <main className="flex flex-1" ref={captureRef}>
        <PDFViewer
          dropped={dropped}
          setDropped={setDropped}
          file={pdfFile}
          containerWidth={containerWidth}
          setContainerWidth={setContainerWidth}
        />
        <AnnotationPanel />
      </main>
    </div>
  );
}
