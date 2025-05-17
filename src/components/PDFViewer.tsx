// PDFViewer.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import { DroppedAnnotation } from "@/components/types";

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.js`;

interface Props {
  dropped: DroppedAnnotation[];
  setDropped: React.Dispatch<React.SetStateAction<DroppedAnnotation[]>>;
  file: File | null;
  containerWidth: number;
  setContainerWidth: (width: number) => void;
}

export default function PDFViewer({
  dropped,
  setDropped,
  file,
  containerWidth,
  setContainerWidth,
}: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [setContainerWidth]);

  return (
    <div ref={containerRef} className="w-2/3 h-screen overflow-auto bg-gray-100 p-4">
      {file ? (
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          {Array.from(new Array(numPages), (_, index) => {
            const pageNumber = index + 1;
            return (
              <div
                key={pageNumber}
                className="relative mb-4"
                onDrop={(e) => {
                  e.preventDefault();
                  const data = e.dataTransfer.getData("text/plain");
                  const parsed = JSON.parse(data);
                  const bounding = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - bounding.left;
                  const y = e.clientY - bounding.top;
                  setDropped((prev) => [
                    ...prev,
                    { ...parsed, x, y, pageNumber },
                  ]);
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <Page pageNumber={pageNumber} width={containerWidth} />
                {dropped
                  .filter((a) => a.pageNumber === pageNumber)
                  .map((anno) => (
                    <div
                      key={anno.id}
                      className="absolute bg-yellow-200 text-sm px-2 py-1 rounded shadow"
                      style={{ left: anno.x, top: anno.y }}
                    >
                      {anno.text}
                    </div>
                  ))}
              </div>
            );
          })}
        </Document>
      ) : (
        <div className="text-center text-gray-500 mt-20">
          PDF 파일을 업로드하세요
        </div>
      )}
    </div>
  );
}
