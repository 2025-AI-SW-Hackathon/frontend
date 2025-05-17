"use client";

import PDFViewer from "@/components/PDFViewer";
import AnnotationPanel from "@/components/AnnotationPanel";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit"; 
import { saveAs } from "file-saver";
import { DroppedAnnotation } from "@/components/types"; 


export default function Home() {
  const captureRef = useRef<HTMLDivElement>(null);
  const [dropped, setDropped] = useState<DroppedAnnotation[]>([]);
  async function handleSaveWithAnnotations(
    url: string,
    droppedAnnotations: DroppedAnnotation[]
  ) {
    const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);
    const fontBytes = await fetch("/fonts/MaruBuri-Bold.ttf").then(res =>
      res.arrayBuffer()
    );
    const customFont = await pdfDoc.embedFont(fontBytes);  
    const pages = pdfDoc.getPages();
    for (const annotation of droppedAnnotations) {
      const page = pages[annotation.pageNumber - 1];
      const { x, y } = annotation;
  
      // HTML coordinate → PDF coordinate (600px 기준 가정)
      const scaledX = (x / 600) * page.getWidth();
      const scaledY = page.getHeight() - ((y / 800) * page.getHeight()); // 반전
  
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
        <button className="px-4 py-2 bg-green-500 text-white rounded">
          녹음 시작
        </button>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() =>
          handleSaveWithAnnotations(
            "/example.pdf", // 원본 PDF 경로
            dropped // PDFViewer에서 관리 중인 주석 상태
          )
        }
      >
        PDF 다운로드
      </button>
      </div>
      <main className="flex flex-1" ref={captureRef}>
      <PDFViewer dropped={dropped} setDropped={setDropped} />
        <AnnotationPanel />
      </main>
    </div>
  );
}
