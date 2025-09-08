"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import UploadArea from "@/components/UploadArea";
import PDFViewer from "@/components/PDFViewer";
import RightPanel from "@/components/RightPanel";
import { useState ,useEffect} from "react";
import { DroppedAnnotation } from "@/components/types";
import { PDFDocument } from "pdf-lib";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | number | null>(null); // ⬅️ 추가: 서버가 주는 fileId 저장
  const [dropped, setDropped] = useState<DroppedAnnotation[]>([]);
  const [renderedSizes, setRenderedSizes] = useState<Record<number, { width: number; height: number }>>({});
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const [isPdfReady, setIsPdfReady] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  type RenderedSizes = Record<number, { width: number; height: number }>;

  type ServerSlide = { pageNumber: number; annotations: any[] };
  const [serverSlides, setServerSlides] = useState<ServerSlide[] | null>(null);

  // 1) isPdfReady + fileId 준비되면 서버에서 최신 스냅샷 가져오기
  useEffect(() => {
    if (!isPdfReady || !fileId) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/annotations?fileId=${fileId}`, {
          headers: (() => {
            const headers: Record<string, string> = {};
            try {
              const { auth } = require("@/lib/auth");
              const token = auth.getAccessToken?.();
              if (token) headers["Authorization"] = `Bearer ${token}`;
            } catch {}
            return headers;
          })(),
        });
        const data = await res.json();
        setServerSlides(data?.slides ?? []);
      } catch (e) {
        console.warn("스냅샷 조회 실패:", e);
      }
    })();
  }, [isPdfReady, fileId]);
  
function restoreFromSlides(
  slides: ServerSlide[],
  rendered: Record<number, { width: number; height: number }>
): DroppedAnnotation[] {
  const out: DroppedAnnotation[] = [];
  for (const s of slides) {
    const r = rendered[s.pageNumber];
    if (!r) continue;
    for (const a of s.annotations) {
      out.push({
        id: a.id,
        pageNumber: s.pageNumber,
        x: (a.x ?? 0) * r.width,
        y: (a.y ?? 0) * r.height,
        width: Math.max((a.w ?? 0.2) * r.width, 100),
        height: Math.max((a.h ?? 0.1) * r.height, 100),
        answerState: a.answerState ?? 2,
        text: a.text ?? "",
      });
    }
  }
  return out;
}

// 2) 페이지 렌더 크기(renderedSizes)가 준비되면 픽셀로 환산해서 dropped에 세팅
useEffect(() => {
  if (!serverSlides || !serverSlides.length) return;
  const ready = serverSlides.every((s) => renderedSizes[s.pageNumber]);
  if (!ready) return;
  setDropped(restoreFromSlides(serverSlides, renderedSizes));
}, [serverSlides, renderedSizes]);



function buildSlidesPayload(
  dropped: DroppedAnnotation[],
  renderedSizes: RenderedSizes
) {
  // pageNumber 별 그룹핑
  const byPage = new Map<number, any[]>();

  for (const a of dropped) {
    const r = renderedSizes[a.pageNumber];
    if (!r) continue; // 렌더 크기 아직 없으면 스킵

    const one = {
      id: a.id,
      text: a.text,
      // payload 넣고 싶으면 파싱해서 넣기(선택)
      // payload: tryParseJSON(a.text),
      x: a.x / r.width,
      y: a.y / r.height,
      w: (a.width ?? 180) / r.width,
      h: Math.max(a.height ?? 100, 100) / r.height,
      source: "MANUAL",                 // 드래그 배치면 보통 MANUAL
      answerState: a.answerState ?? 2,
      order: (a as any).order ?? 0,     // order 안 쓰면 0
    };

    if (!byPage.has(a.pageNumber)) byPage.set(a.pageNumber, []);
    byPage.get(a.pageNumber)!.push(one);
  }

  // slides 배열로 변환 (페이지 오름차순 정렬 권장)
  const slides = Array.from(byPage.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([pageNumber, annotations]) => ({
      pageNumber,
      annotations: (annotations as any[]).sort((x, y) => (x.order ?? 0) - (y.order ?? 0)),
    }));

  return slides;
}


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

      // ⬇️ 업로드 응답에 fileId가 있으면 저장
      if (data.fileId) setFileId(data.fileId);

      if (data.status === "ready") {
        setIsPdfReady(true);
      }
    } catch (e) {
      alert("PDF 업로드 실패");
    }
  }

  // PDF에 어노테이션 그려서 "다운로드" (기존 기능 유지)
  async function handleSaveWithAnnotations() {
    if (!pdfFile) return;

    const existingPdfBytes = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const pages = pdfDoc.getPages();
    
    // 각 주석을 개별적으로 캡처 (내용 크기에 맞게)
    for (const annotation of dropped) {
      const page = pages[annotation.pageNumber - 1];
      const rendered = renderedSizes[annotation.pageNumber];
      if (!rendered) continue;

      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      const scaledX = (annotation.x / rendered.width) * pageWidth;
      const scaledY = pageHeight - (annotation.y / rendered.height) * pageHeight;
      
      // 주석 카드의 실제 내용 영역만 찾기
      const cardElement = document.querySelector(`[data-ann-id="${annotation.id}"]`) as HTMLElement;
      if (!cardElement) {
        console.warn(`Card element not found for annotation ${annotation.id}`);
        continue;
      }

      // 전체 카드 요소를 그대로 캡처
      console.log(`Capturing entire card for annotation ${annotation.id}`);
      console.log(`Card element:`, cardElement);

      // PDF 캡처를 위해 임시로 라벨 위치 조정
      console.log('Card HTML:', cardElement.outerHTML);
      
      const originalStyles: { element: HTMLElement; transform: string; marginTop: string }[] = [];

      try {
        
        // 텍스트가 들어있는 span 요소를 직접 찾기
        const textSpans = cardElement.querySelectorAll('span');
        textSpans.forEach((span) => {
          const spanEl = span as HTMLElement;
          // 라벨 텍스트가 포함된 span 찾기
          const hasLabelText = spanEl.textContent?.includes('외부 검색') || 
                              spanEl.textContent?.includes('음성') || 
                              spanEl.textContent?.includes('자료 기반');
          
          if (hasLabelText) {
            console.log('Found label span:', spanEl.className, spanEl.textContent);
            const currentTransform = spanEl.style.transform || '';
            const currentMarginTop = spanEl.style.marginTop || '';
            originalStyles.push({ element: spanEl, transform: currentTransform, marginTop: currentMarginTop });
            
            // 텍스트만 위로 이동
            spanEl.style.transform = 'translateY(-6px)';
            spanEl.style.display = 'inline-block'; // transform이 적용되도록
          }
        });
        
        // 전체 카드를 고품질로 캡처
        const canvas = await html2canvas(cardElement, {
          backgroundColor: null, // 투명 배경 (카드 자체 배경색 사용)
          scale: 3, // 더 고해상도로 캡처
          useCORS: true,
          allowTaint: true,
          logging: false,
          removeContainer: true,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0,
          width: cardElement.offsetWidth,
          height: cardElement.offsetHeight,
        });

        const dataUrl = canvas.toDataURL("image/png", 1.0);
        const png = await pdfDoc.embedPng(dataUrl);

        // 실제 캡처된 캔버스 크기 기준으로 스케일링
        const capturedWidth = canvas.width;
        const capturedHeight = canvas.height;
        
        console.log(`Canvas size: ${capturedWidth}x${capturedHeight}, PNG size: ${png.width}x${png.height}`);
        
        // 고해상도 캡처 보정: scale 3으로 캡처했으므로 1/3로 보정하여 원본 크기로 만든 후 0.5배 축소
        const actualCardWidth = capturedWidth / 3; // scale 3 보정
        const actualCardHeight = capturedHeight / 3; // scale 3 보정
        
        const scaledWidth = (actualCardWidth / rendered.width) * pageWidth * 0.5;
        const scaledHeight = (actualCardHeight / rendered.height) * pageHeight * 0.5;

        page.drawImage(png, {
          x: scaledX,
          y: scaledY - scaledHeight,
          width: scaledWidth,
          height: scaledHeight,
        });

        // 원래 스타일로 복원
        originalStyles.forEach(({ element, transform, marginTop }) => {
          element.style.transform = transform;
          element.style.marginTop = marginTop;
          if (element.tagName === 'SPAN' && !transform) {
            element.style.display = ''; // display도 원래대로
          }
        });

        console.log(`Annotation ${annotation.id} captured successfully - Size: ${scaledWidth}x${scaledHeight}`);
      } catch (error) {
        console.error(`Annotation capture error for ${annotation.id}:`, error);
        
        // 에러 발생 시에도 스타일 복원
        try {
          originalStyles.forEach(({ element, transform, marginTop }) => {
            element.style.transform = transform;
            element.style.marginTop = marginTop;
            if (element.tagName === 'SPAN' && !transform) {
              element.style.display = '';
            }
          });
        } catch {}
      }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    saveAs(blob, "annotated.pdf");
  }

  // ⬇️ 정규화 헬퍼: 화면 크기와 무관하게 복원 가능하도록 저장
  function toNormalized(a: DroppedAnnotation) {
    const rs = renderedSizes[a.pageNumber];
    if (!rs) return null;
    const w = (a.width ?? 180);
    const h = Math.max(a.height ?? 100, 100);
    return {
      id: a.id,
      fileId: fileId ?? null,
      page: a.pageNumber,
      x: a.x / rs.width,
      y: a.y / rs.height,
      w: w / rs.width,
      h: h / rs.height,
      answerState: a.answerState ?? 2,
      text: a.text, // 문자열 그대로(내부 JSON 포함 가능)
    };
  }

  // ⬇️ "저장하기(서버)" 스냅샷
  async function handleSaveAllAnnotations() {
    try {
      if (!fileId) {
        alert("fileId가 없습니다. 먼저 PDF를 업로드해 주세요.");
        return;
      }
  
      const slides = buildSlidesPayload(dropped, renderedSizes);
  
      // 새로고침 대비 로컬 캐시(선택)
      localStorage.setItem(`annotations:${fileId}`, JSON.stringify({ slides }));
  
      const res = await fetch(`${API_BASE_URL}/api/annotations/snapshot`, {
        method: "POST",
        headers: (() => {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          try {
            const { auth } = require("@/lib/auth");
            const token = auth.getAccessToken?.();
            if (token) headers["Authorization"] = `Bearer ${token}`;
          } catch {}
          return headers;
        })(),
        body: JSON.stringify({ fileId, slides }), // ✅ 백엔드 스키마에 맞춰 전송
      });
  
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `저장 실패 (HTTP ${res.status})`);
      }
      alert("어노테이션이 서버에 저장되었습니다.");
    } catch (err) {
      console.error(err);
      alert("저장 중 오류가 발생했습니다.");
    }
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
                  // ⬇️ 추가: 저장하기(서버) 핸들러
                  handleSaveAllAnnotations={handleSaveAllAnnotations}
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
