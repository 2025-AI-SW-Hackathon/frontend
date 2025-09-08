"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import UploadArea from "@/components/UploadArea";
import PDFViewer from "@/components/PDFViewer";
import RightPanel from "@/components/RightPanel";
import { DroppedAnnotation } from "@/components/types";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { saveAs } from "file-saver";
import { useRef, useState ,useEffect} from "react";
import { useSearchParams } from "next/navigation";
import { FileAnnotationResponse } from "@/types/FileAnnotationResponse";
import { useAuth } from "@/components/AuthContext";

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | number | null>(null); // ⬅️ 추가: 서버가 주는 fileId 저장
  const [dropped, setDropped] = useState<DroppedAnnotation[]>([]);
  const [renderedSizes, setRenderedSizes] = useState<Record<number, { width: number; height: number }>>({});
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const [isPdfReady, setIsPdfReady] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [versionMeta, setVersionMeta] = useState<{version?: number; latest?: boolean; snapshotCreatedAt?: string}>({});
  type RenderedSizes = Record<number, { width: number; height: number }>;
  const { user, signIn, signOut, isAuthenticated } = useAuth();
  type ServerSlide = { pageNumber: number; annotations: any[] };
  const [serverSlides, setServerSlides] = useState<ServerSlide[] | null>(null);

  const buildAuthHeaders = (token?: string) => {
    const h: Record<string, string> = {};
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  };
  const sp = useSearchParams();
  const mode = sp.get("mode");
  const qpFileId = sp.get("fileId");
  const qpVersion = sp.get("version");
  const isHistoryMode = mode === "history";
  // 1) isPdfReady + fileId 준비되면 서버에서 최신 스냅샷 가져오기
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
            } catch (_) {}
            return headers;
          })(),
        });
        const data = await res.json();
        setServerSlides(data?.slides ?? []);
      } catch (e) {
        console.warn("스냅샷 조회 실패:", e);
      }
    })();
  }, [isPdfReady, fileId, isHistoryMode]);

// 히스토리 모드: 서버에서 파일+주석 스냅샷 조회 → 상태 수화
useEffect(() => {
    if (!isHistoryMode) return;
    if (!qpFileId) return;
    (async () => {
      try {
        const url = `${API_BASE_URL}/api/files/${qpFileId}/annotations${qpVersion ? `?version=${qpVersion}` : ""}`;
             const res = await fetch(url, {
                 credentials: "include",
                 headers: (() => {
                  const headers: Record<string, string> = {};
                  try {
                    const { auth } = require("@/lib/auth");
                    const token = auth.getAccessToken?.();
                    if (token) headers["Authorization"] = `Bearer ${token}`;
                  } catch (_) {}
                  return headers;
                })(),               });        if (!res.ok) throw new Error(await res.text());
        const data /*: FileAnnotationResponse*/ = await res.json();
        // 파일/주석 상태 세팅
        setPdfFile(null);                 // File 대신 URL 사용
        setPdfUrl(data.fileUrl);
        setFileId(data.fileId);
        setServerSlides(data.slides || []);
        setVersionMeta({ version: data.version, latest: data.latest, snapshotCreatedAt: data.snapshotCreatedAt });
        
             const fileRes = await fetch(`${API_BASE_URL}/api/files/${data.fileId}/content`, {
                 credentials: "include",
                 headers: (() => {
                  const headers: Record<string, string> = {};
                  try {
                    const { auth } = require("@/lib/auth");
                    const token = auth.getAccessToken?.();
                    if (token) headers["Authorization"] = `Bearer ${token}`;
                  } catch (_) {}
                  return headers;
                })(),                });
               if (!fileRes.ok) throw new Error(await fileRes.text());
               const blob = await fileRes.blob(); // application/pdf
               const objectUrl = URL.createObjectURL(blob);
               setPdfFile(null);          // File 대신 URL 사용
               setPdfUrl(objectUrl);
        
        
        
        setIsPdfReady(true);              // 이후 restore 이펙트가 픽셀 변환해서 dropped 채움
      } catch (e) {
        console.error(e);
        alert("히스토리 불러오기에 실패했습니다.");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHistoryMode, qpFileId, qpVersion]);
  
function restoreFromSlides(
  slides: ServerSlide[],
  rendered: Record<number, { width: number; height: number }>
): DroppedAnnotation[] {
  const out: DroppedAnnotation[] = [];
  for (const s of slides) {
    const r = rendered[s.pageNumber];
    if (!r) continue;
    for (const a of s.annotations) {
            const nx = (a.x ?? a.position?.x ?? 0);
            const ny = (a.y ?? a.position?.y ?? 0);
            const nw = (a.w ?? a.size?.width ?? 0.2);
            const nh = (a.h ?? a.size?.height ?? 0.1);
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
      const existingPdfBytes =
        pdfFile
          ? await pdfFile.arrayBuffer()
          : pdfUrl
            ? await fetch(pdfUrl).then(r => r.arrayBuffer())
            : null;
      if (!existingPdfBytes) {
        alert("PDF 원본이 없습니다.");
        return;
      }
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
      const scaledMaxWidth = ((annotation.width ?? 180) / rendered.width) * pageWidth;
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
            maxWidth: scaledMaxWidth
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
      console.log("fileId:",fileId)
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
        { (!pdfFile && !pdfUrl) ?(
            <UploadArea />
          ) : !isPdfReady ? (
            <div className="w-full flex items-center justify-center text-gray-600 text-3xl animate-pulse">
              ⏳ PDF 분석 중입니다...
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
              + <PDFViewer
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
