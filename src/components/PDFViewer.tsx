  "use client";

  import { useState, useRef, useEffect } from "react";
  import { pdfjs, Document, Page } from "react-pdf";
  import "react-pdf/dist/esm/Page/AnnotationLayer.css";
  import { DroppedAnnotation } from "@/components/types";
  import { Rnd } from "react-rnd";
  import { Pencil } from "lucide-react";

  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.js`;



  interface Props {
    dropped: DroppedAnnotation[];
    setDropped: React.Dispatch<React.SetStateAction<DroppedAnnotation[]>>;
    file: File | null;
    containerWidth: number;
    setContainerWidth: (width: number) => void;
    setRenderedSizes: React.Dispatch<
      React.SetStateAction<Record<number, { width: number; height: number }>>
    >;
  }

  export default function PDFViewer({
    dropped,
    setDropped,
    file,
    containerWidth,
    setContainerWidth,
    setRenderedSizes,
  }: Props) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    const el = textareaRef.current;
    if (!selectedAnnotationId || !el) return;
  
    // ✨ textarea가 실제 DOM에 렌더된 후 한 프레임 쉬고 계산
    const resizeObserver = new ResizeObserver(() => {
      const newHeight = el.scrollHeight;
      const currentHeight = dropped.find((a) => a.id === selectedAnnotationId)?.height;
  
      if (Math.abs((currentHeight ?? 0) - newHeight) > 1) {
        updateAnnotation(selectedAnnotationId, { height: newHeight });
      }
    });
  
    resizeObserver.observe(el);
  
    return () => resizeObserver.disconnect();
  }, [selectedAnnotationId]); // ⭐ editValue가 아니라, edit모드 진입에만 반응
  


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

    const updateAnnotation = (
      id: string,
      updates: Partial<{ x: number; y: number; width: number; height: number; text: string }>
    ) => {
      setDropped((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                ...updates,
              }
            : a
        )
      );
    };
    const handleConfirmEdit = (annoId: string) => {
      const el = textareaRef.current;
      const refinedText = editValue;

      const lines = el?.value.split("\n").flatMap((line) => {
        const temp = document.createElement("div");
        temp.style.width = el.clientWidth + "px";
        temp.style.font = window.getComputedStyle(el).font;
        temp.style.lineHeight = window.getComputedStyle(el).lineHeight;
        temp.style.whiteSpace = "pre-wrap";
        temp.style.visibility = "hidden";
        temp.style.position = "absolute";
        temp.style.pointerEvents = "none";
        temp.style.zIndex = "-1";
        temp.textContent = ""; // 초기화
      
        // 줄 단위로 분리하려면 단어 기준 분할이 필요
        const words = line.split(" ");
        let currentLine = "";
        let result: string[] = [];
      
        document.body.appendChild(temp);
      
        for (let word of words) {
          const testLine = currentLine + (currentLine ? " " : "") + word;
          temp.textContent = testLine;
          if (temp.scrollWidth > el.clientWidth) {
            result.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) result.push(currentLine);
      
        document.body.removeChild(temp);
        return result;
      });
    
      
      console.log("✅ refinedText:", refinedText);
      console.log("✅ lines 내용:", lines);
    
      updateAnnotation(annoId, {
        text: JSON.stringify({
          refinedText,
          lines, // ✅ 시각적 줄 상태도 저장
        }),        width: el?.offsetWidth,
        height: el?.offsetHeight,
      });
    
      setSelectedAnnotationId(null);
    };
    

    return (  
      <div ref={containerRef} className="w-full h-screen overflow-y-auto bg-gray-100 p-4">
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
                  id={`pdf-page-${pageNumber}`}
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
                        ...parsed,
                        text: parsed.text ?? "", // ✅ ensure text is defined
                        x,
                        y,
                        width: parsed.width ?? 160,     // ✅ 수정된 값 유지
                        height: parsed.height ?? 60,    // ✅ 수정된 값 유지
                        pageNumber,
                      },
                    ]);

                    const dropEvent = new CustomEvent("annotation-dropped", {
                      detail: parsed.id,
                    });
                    window.dispatchEvent(dropEvent);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={0.9}
                    width={containerWidth}
                    onRenderSuccess={() => {
                      const el = document.getElementById(`pdf-page-${pageNumber}`);
                      if (el) {
                        const canvas = el.querySelector("canvas");
                        const textLayer = el.querySelector(".react-pdf__Page__textContent");
                        const annotationLayer = el.querySelector(".react-pdf__Page__annotations");
                    
                        [canvas, textLayer, annotationLayer].forEach((layer) => {
                          if (layer instanceof HTMLElement) {
                            layer.style.pointerEvents = "none";
                          }
                        });
                    
                        setRenderedSizes((prev) => ({
                          ...prev,
                          [pageNumber]: {
                            width: el.clientWidth,
                            height: el.clientHeight,
                          },
                        }));
                      }
                    }}
                  />

                  {dropped
                    .filter((a) => a.pageNumber === pageNumber)
                    .map((anno) => {
                      const isSelected = selectedAnnotationId === anno.id;
                      return (
  <Rnd
    key={anno.id}
    size={{
      width: anno.width ?? 160,
      height: anno.height ?? 60,
    }}
    position={{ x: anno.x, y: anno.y }}
    onDragStop={(e, d) => {
      updateAnnotation(anno.id, { x: d.x, y: d.y });
    }}

    onResize={(e, dir, ref, delta, position) => {
      const textarea = ref.querySelector("textarea");
      const newHeight =
        textarea && textarea.scrollHeight > 0 ? textarea.scrollHeight : ref.offsetHeight;
    
      updateAnnotation(anno.id, {
        width: ref.offsetWidth,
        height: newHeight,
        x: position.x,
        y: position.y,
      });
    }}

    
    onResizeStop={(e, dir, ref, delta, position) => {
      const newWidth = ref.offsetWidth;
      console.log("📐 New newWidth after resize:", newWidth);

      // ✨ textarea 기준 높이 재계산
      const textarea = ref.querySelector("textarea");
      
      const newHeight =
        textarea && textarea.scrollHeight > 0 ? textarea.scrollHeight : ref.offsetHeight;
        setTimeout(() => {
          const newHeight =
            textarea && textarea.scrollHeight > 0 ? textarea.scrollHeight : ref.offsetHeight;
            console.log("📐 New height after resize:", newHeight);

      updateAnnotation(anno.id, {
        width: newWidth,
        height: newHeight,
        x: position.x,
        y: position.y,
      });
    },0);
    }}
    bounds="parent"
    enableResizing={{
      bottomRight: true,
      bottom: true,
      right: true,
    }}
    className="absolute pointer-events-auto"
    cancel='[data-non-draggable="true"]'
    disableDragging={!isSelected}>
    {isSelected ? (
      <textarea
  ref={textareaRef}
  
  id={`annotation-${anno.id}`}
      name={`annotation-${anno.id}`}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => handleConfirmEdit(anno.id)}
        className="w-full h-full bg-yellow-200 text-sm p-2 rounded shadow whitespace-pre-line break-words resize"
        autoFocus
      />
    ) : (
      <div className="relative group w-full h-full bg-yellow-200 text-sm p-2 rounded shadow whitespace-pre-line break-words">
      {isSelected ? (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleConfirmEdit(anno.id)}

          autoFocus
          className="bg-yellow-200 text-sm p-2 rounded shadow resize w-full min-w-[100px] min-h-[50px] whitespace-pre-wrap break-words"
        />
      ) : (
<>
  {(() => {
    try {
      return JSON.parse(anno.text).refinedText;
    } catch {
      return anno.text;
    }
  })()}
</>      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedAnnotationId(anno.id);
          try {
            const parsed = JSON.parse(anno.text);
            setEditValue(parsed.refinedText ?? "");
          } catch {
            setEditValue(() => {
              try {
                return JSON.parse(anno.text).refinedText;
              } catch {
                return anno.text.includes("refinedText") ? "" : anno.text;
              }
            });          }        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="non-draggable absolute top-1 right-1 z-50 pointer-events-auto"
      >
        <Pencil size={14} />
      </button>
    </div>
    )}
  </Rnd>



                      );
                    })}
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
