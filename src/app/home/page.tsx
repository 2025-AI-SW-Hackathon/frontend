"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import UploadArea from "@/components/UploadArea";
import PDFViewer from "@/components/PDFViewer";
import RightPanel from "@/components/RightPanel";
import { DroppedAnnotation } from "@/components/types";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FileAnnotationResponse } from "@/types/FileAnnotationResponse";
import { useAuth } from "@/components/AuthContext";

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [originalPdfBytes, setOriginalPdfBytes] = useState<ArrayBuffer | null>(null); // ⬅️ 원본 바이트 캐시

  const [fileId, setFileId] = useState<string | number | null>(null);
  const [dropped, setDropped] = useState<DroppedAnnotation[]>([]);
  const [renderedSizes, setRenderedSizes] = useState<Record<number, { width: number; height: number }>>({});
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [versionMeta, setVersionMeta] = useState<{version?: number; latest?: boolean; snapshotCreatedAt?: string}>({});
  type RenderedSizes = Record<number, { width: number; height: number }>;

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const { user } = useAuth();

  type ServerSlide = { pageNumber: number; annotations: any[] };
  const [serverSlides, setServerSlides] = useState<ServerSlide[] | null>(null);

  const sp = useSearchParams();
  const mode = sp.get("mode");
  const qpFileId = sp.get("fileId");
  const qpVersion = sp.get("version");
  const isHistoryMode = mode === "history";

  // ====== 최신 스냅샷 (업로드 모드) ======
  useEffect(() => {
    if (isHistoryMode) return;
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
        if (!res.ok) return;
        const data = await res.json();
        setServerSlides(data?.slides ?? []);
      } catch (e) {
        console.warn("스냅샷 조회 실패:", e);
      }
    })();
  }, [isPdfReady, fileId, isHistoryMode]);

  // ====== 히스토리 모드: 메타 + 파일 바이트 ======
  useEffect(() => {
    if (!isHistoryMode) return;
    if (!qpFileId) return;

    let blobUrlToRevoke: string | null = null;

    (async () => {
      try {
        // 1) 메타/주석
        const url = `${API_BASE_URL}/api/files/${qpFileId}/annotations${qpVersion ? `?version=${qpVersion}` : ""}`;
        const res = await fetch(url, {
          credentials: "include",
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
        if (!res.ok) throw new Error(await res.text());
        const data: FileAnnotationResponse = await res.json();

        setPdfFile(null);
        setFileId(data.fileId);
        setServerSlides(data.slides || []);
        setVersionMeta({ version: data.version, latest: data.latest, snapshotCreatedAt: data.snapshotCreatedAt });

        // 2) 실제 PDF 바이트 수신
        const fileRes = await fetch(`${API_BASE_URL}/api/files/${data.fileId}/content`, {
          credentials: "include",
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
        if (!fileRes.ok) throw new Error(await fileRes.text());
        const blob = await fileRes.blob(); // application/pdf

        // ⬇️ 원본 바이트 캐시 (다운로드 시 사용)
        const bytes = await blob.arrayBuffer();
        setOriginalPdfBytes(bytes);

        // 뷰어에 표시할 objectURL
        const objectUrl = URL.createObjectURL(blob);
        blobUrlToRevoke = objectUrl;
        setPdfUrl(objectUrl);

        setIsPdfReady(true);
      } catch (e) {
        console.error(e);
        alert("히스토리 불러오기에 실패했습니다.");
      }
    })();

    // cleanup
    return () => {
      if (blobUrlToRevoke) URL.revokeObjectURL(blobUrlToRevoke);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHistoryMode, qpFileId, qpVersion]);

  // 서버 주석을 화면 픽셀 단위로 복원
  function restoreFromSlides(
    slides: ServerSlide[],
    rendered: Record<number, { width: number; height: number }>
  ): DroppedAnnotation[] {
    const out: DroppedAnnotation[] = [];
    for (const s of slides) {
      const r = rendered[s.pageNumber];
      if (!r) continue;
      for (const a of s.annotations) {
        const nx = a.x ?? a.position?.x ?? 0;
        const ny = a.y ?? a.position?.y ?? 0;
        const nw = a.w ?? a.size?.width ?? 0.2;
        const nh = a.h ?? a.size?.height ?? 0.1;
        out.push({
          id: a.id,
          pageNumber: s.pageNumber,
          x: nx * r.width,
          y: ny * r.height,
          width: Math.max(nw * r.width, 100),
          height: Math.max(nh * r.height, 100),
          answerState: a.answerState ?? 2,
          text: a.text ?? "",
        });
      }
    }
    return out;
  }

  // 렌더 사이즈 준비되면 복원 실행
  useEffect(() => {
    if (!serverSlides || !serverSlides.length) return;
    const ready = serverSlides.every((s) => renderedSizes[s.pageNumber]);
    if (!ready) return;
    setDropped(restoreFromSlides(serverSlides, renderedSizes));
  }, [serverSlides, renderedSizes]);

  // 스냅샷 전송용 payload
  function buildSlidesPayload(
    dropped: DroppedAnnotation[],
    renderedSizes: RenderedSizes
  ) {
    const byPage = new Map<number, any[]>();

    for (const a of dropped) {
      const r = renderedSizes[a.pageNumber];
      if (!r) continue;

      const one = {
        id: a.id,
        text: a.text,
        x: a.x / r.width,
        y: a.y / r.height,
        w: (a.width ?? 180) / r.width,
        h: Math.max(a.height ?? 100, 100) / r.height,
        source: "MANUAL",
        answerState: a.answerState ?? 2,
        order: (a as any).order ?? 0,
      };

      if (!byPage.has(a.pageNumber)) byPage.set(a.pageNumber, []);
      byPage.get(a.pageNumber)!.push(one);
    }

    const slides = Array.from(byPage.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([pageNumber, annotations]) => ({
        pageNumber,
        annotations: (annotations as any[]).sort((x, y) => (x.order ?? 0) - (y.order ?? 0)),
      }));

    return slides;
  }

  // 업로드 시: 원본 바이트도 같이 캐싱
  async function uploadPdfToBackend(file: File) {
    try {
      // ⬇️ 뷰어/내보내기용 원본 바이트 캐시
      const bytes = await file.arrayBuffer();
      setOriginalPdfBytes(bytes);
      setPdfUrl(null); // 업로드 모드에선 objectURL 안 써도 됨
      setPdfFile(file);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE_URL}/api/pdf/upload`, {
        method: "POST",
        headers: (() => {
          const headers: Record<string, string> = {};
          try {
            const { auth } = require("@/lib/auth");
            const token = auth.getAccessToken?.();
            if (token) headers["Authorization"] = `Bearer ${token}`;
          } catch {}
          return headers;
        })(),
        body: formData,
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (data.fileId) setFileId(data.fileId);
      if (data.status === "ready") setIsPdfReady(true);
    } catch (e) {
      console.error(e);
      alert("PDF 업로드 실패");
    }
  }

  // PDF 내보내기 (히스토리/업로드 공통)
  function toLines(text?: string) {
    if (!text) return [""];
    try {
      const parsed = JSON.parse(text);
      const lines =
        parsed?.lines ??
        (parsed?.refinedText ? String(parsed.refinedText).split("\n") : null);
      return lines ?? [String(text)];
    } catch {
      return [String(text)];
    }
  }
  
  async function handleSaveWithAnnotations() {
    const existingPdfBytes =
      originalPdfBytes ??
      (pdfFile
        ? await pdfFile.arrayBuffer()
        : pdfUrl
        ? await fetch(pdfUrl).then((r) => r.arrayBuffer()).catch(() => null)
        : null);
  
    if (!existingPdfBytes) {
      alert("PDF 원본이 없습니다. 업로드 또는 히스토리로 파일을 먼저 로드하세요.");
      return;
    }
  
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);
  
    // 폰트: 실패해도 진행
    let customFont: any = undefined;
    try {
      const fontBytes = await fetch("/fonts/MaruBuri-Bold.ttf").then((res) => res.arrayBuffer());
      customFont = await pdfDoc.embedFont(fontBytes);
    } catch {}
  
    const pages = pdfDoc.getPages();
  
    for (const annotation of dropped) {
      const page = pages[annotation.pageNumber - 1];
      const rendered = renderedSizes[annotation.pageNumber];
      if (!rendered) continue;
  
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
  
      const scaledX = (annotation.x / rendered.width) * pageWidth;
      const scaledY = pageHeight - (annotation.y / rendered.height) * pageHeight;
      const scaledMaxWidth = ((annotation.width ?? 180) / rendered.width) * pageWidth;
  
      const textColor =
        annotation.answerState === 0
          ? rgb(1, 0, 0)
          : annotation.answerState === 2
          ? rgb(0.2, 0.4, 0.9)
          : rgb(1, 0.6, 0);
  
      // 1) 카드 DOM 캡처
      const cardElement = document.querySelector(
        `[data-ann-id="${annotation.id}"]`
      ) as HTMLElement | null;
  
      if (cardElement) {
        try {
          const canvas = await html2canvas(cardElement, {
            backgroundColor: null,
            scale: 3,
            useCORS: true,
            allowTaint: true,
            logging: false,
          });
  
          const dataUrl = canvas.toDataURL("image/png", 1.0);
          const png = await pdfDoc.embedPng(dataUrl);
  
          const actualCardWidth = canvas.width / 3;
          const actualCardHeight = canvas.height / 3;
  
          const scaledWidth = (actualCardWidth / rendered.width) * pageWidth * 0.5;
          const scaledHeight = (actualCardHeight / rendered.height) * pageHeight * 0.5;
  
          page.drawImage(png, {
            x: scaledX,
            y: scaledY - scaledHeight,
            width: scaledWidth,
            height: scaledHeight,
          });
  
          continue; // 성공했으면 다음 주석으로
        } catch (err) {
          console.warn("DOM 캡처 실패. 텍스트 폴백으로 그립니다.", err);
        }
      }
  
      // 2) 폴백: 텍스트 직접 그리기
      const linesArr = toLines(annotation.text);
      for (let i = 0; i < linesArr.length; i++) {
        const ln = String(linesArr[i] ?? "");
        page.drawText(ln, {
          x: scaledX,
          y: scaledY - i * 12,
          size: 12,
          font: customFont,             // undefined면 기본 폰트 사용
          color: textColor,
          maxWidth: scaledMaxWidth,
        });
      }
    } // <-- for-of 끝
  
    const outBytes = await pdfDoc.save();
    const blob = new Blob([outBytes], { type: "application/pdf" });
    saveAs(blob, "annotated.pdf");
  }
  

  // 스냅샷 저장
  async function handleSaveAllAnnotations() {
    try {
      if (!fileId) {
        alert("fileId가 없습니다. 먼저 PDF를 업로드해 주세요.");
        return;
      }

      const slides = buildSlidesPayload(dropped, renderedSizes);
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
        body: JSON.stringify({ fileId, slides }),
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
          {!pdfFile && !pdfUrl ? (
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
                  fileOrUrl={pdfUrl ?? pdfFile}
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
                  pdfUrl={pdfUrl}
                  handleSaveWithAnnotations={handleSaveWithAnnotations}
                  handleSaveAllAnnotations={handleSaveAllAnnotations}
                />
              </div>
            </>
          )}
        </main>
        <input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              setIsPdfReady(false);
              // 원본 바이트/상태 먼저 세팅
              const bytes = await file.arrayBuffer();
              setOriginalPdfBytes(bytes);
              setPdfFile(file);
              setPdfUrl(null);
              uploadPdfToBackend(file);
            }
          }}
        />
      </div>
    </div>
  );
}