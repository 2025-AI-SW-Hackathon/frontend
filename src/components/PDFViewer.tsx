"use client";

import { useState } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import { DroppedAnnotation } from "@/components/types"; 

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.js`;

interface Props {
    dropped: DroppedAnnotation[];
    setDropped: React.Dispatch<React.SetStateAction<DroppedAnnotation[]>>;
  }

export default function PDFViewer({ dropped, setDropped }: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  
  return (
    <div className="w-2/3 h-screen overflow-auto bg-gray-100 p-4">
      <Document
        file="/example.pdf"
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
                  {
                    id: parsed.id,
                    text: parsed.text,
                    x,
                    y,
                    pageNumber,
                  },
                ]);
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <Page pageNumber={pageNumber} width={600} />
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
    </div>
  );
}