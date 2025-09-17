"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { ChevronRight, Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Image from "next/image";

type NoteItem = {
  id: string;
  title: string;
  tags: string[];
  duration: string;
  createdAt: string;
  inProgress?: boolean;
  icon: string;
  summary?: string;
};

const mockNotesByFolder: Record<string, NoteItem[]> = {
  database: [
    { id: "n1", title: "정규화 원리 정리", tags: ["정규화", "1NF", "RDB"], duration: "02:22:22", createdAt: "2025. 4. 30, 오전 11:06", icon: "notebook.png", summary: "정규화는 데이터베이스에서 중복을 제거하고 데이터 무결성을 보장하는 과정입니다. 1NF는 원자값만 허용, 2NF는 부분 함수 종속성 제거, 3NF는 이행적 함수 종속성 제거를 의미합니다." },
    { id: "n2", title: "인덱스 설계와 활용", tags: ["인덱스", "쿼리"], duration: "00:59:09", createdAt: "2025. 4. 29, 오후 4:31", icon: "bookmark.png", summary: "인덱스는 데이터베이스에서 빠른 검색을 위한 자료구조로, B-tree는 범위 검색에 유리하고 해시는 등호 검색에 최적화되어 있습니다." },
    { id: "n3", title: "ACID 속성과 트랜잭션", tags: ["ACID", "트랜잭션", "동시성"], duration: "01:45:30", createdAt: "2025. 4. 28, 오후 2:15", icon: "notebook.png", summary: "ACID는 트랜잭션의 4가지 속성으로, 원자성(모두 실행/취소), 일관성(무결성 유지), 격리성(동시 실행 제어), 지속성(영구 저장)을 의미합니다." },
    { id: "n4", title: "SQL 조인과 서브쿼리", tags: ["SQL", "JOIN", "서브쿼리"], duration: "01:32:18", createdAt: "2025. 4. 27, 오전 10:20", icon: "bookmark.png", summary: "JOIN은 테이블을 연결하는 SQL 기능으로, INNER JOIN은 교집합, LEFT/RIGHT JOIN은 기준 테이블 포함, FULL OUTER JOIN은 합집합을 반환합니다." },
    { id: "n5", title: "데이터베이스 설계 ERD", tags: ["ERD", "설계", "관계"], duration: "02:15:45", createdAt: "2025. 4. 26, 오후 3:40", icon: "folder.png", summary: "ERD는 데이터베이스 설계를 시각화한 도구로, 엔티티(테이블), 속성(컬럼), 관계(연결)를 통해 1:1, 1:N, M:N 관계를 표현합니다." },
    { id: "n6", title: "NoSQL 데이터베이스 개론", tags: ["NoSQL", "MongoDB", "문서DB"], duration: "01:58:22", createdAt: "2025. 4. 25, 오전 9:15", icon: "notebook.png", summary: "NoSQL은 관계형 DB의 대안으로, 문서형(MongoDB), 키-값(Redis), 컬럼형(Cassandra), 그래프(Neo4j) 등이 있으며 대용량 데이터와 수평 확장에 유리합니다." },
    { id: "n7", title: "데이터베이스 백업과 복구", tags: ["백업", "복구", "DBA"], duration: "01:25:33", createdAt: "2025. 4. 24, 오후 4:50", icon: "bookmark.png", summary: "데이터베이스 백업은 데이터 손실 방지를 위한 핵심 작업으로, 풀/증분/차등 백업 방식과 RTO/RPO 목표를 고려해야 합니다." },
    { id: "n8", title: "데이터베이스 성능 튜닝", tags: ["성능", "튜닝", "최적화"], duration: "02:08:17", createdAt: "2025. 4. 23, 오전 11:30", icon: "folder.png", summary: "성능 튜닝은 쿼리 실행 속도 최적화 과정으로, 실행 계획 분석, 인덱스 생성, 쿼리 최적화, 하드웨어 조정을 통해 응답 시간을 단축시킵니다." },
    { id: "n9", title: "분산 데이터베이스 시스템", tags: ["분산", "CAP", "일관성"], duration: "01:42:55", createdAt: "2025. 4. 22, 오후 2:25", icon: "notebook.png", summary: "분산 데이터베이스는 여러 노드에 데이터를 분산 저장하며, CAP 정리(일관성/가용성/분할 허용성 중 2개 선택)와 샤딩/리플리케이션으로 확장성을 확보합니다." },
    { id: "n10", title: "데이터베이스 보안과 권한", tags: ["보안", "권한", "암호화"], duration: "01:18:42", createdAt: "2025. 4. 21, 오전 10:45", icon: "bookmark.png", summary: "데이터베이스 보안은 무결성과 기밀성 보장을 위해 사용자 인증, 권한 관리, 데이터 암호화, 접근 제어, 감사 로그를 통해 강화합니다." },
    { id: "n11", title: "데이터 웨어하우스 설계", tags: ["DW", "OLAP", "스타스키마"], duration: "02:33:20", createdAt: "2025. 4. 20, 오후 1:15", icon: "folder.png", summary: "데이터 웨어하우스는 의사결정 지원을 위한 대용량 저장소로, OLAP 시스템과 스타 스키마(팩트/차원 테이블)를 통해 다차원 분석을 지원합니다." },
    { id: "n12", title: "데이터베이스 모니터링", tags: ["모니터링", "성능", "로그"], duration: "01:35:28", createdAt: "2025. 4. 19, 오전 8:30", icon: "notebook.png", summary: "데이터베이스 모니터링은 시스템 상태와 성능을 지속 관찰하여 CPU/메모리/디스크 사용률을 모니터링하고 느린 쿼리와 데드락을 감지합니다." },
    { id: "n13", title: "데이터베이스 마이그레이션", tags: ["마이그레이션", "변경관리", "버전"], duration: "01:52:14", createdAt: "2025. 4. 18, 오후 3:20", icon: "bookmark.png", summary: "마이그레이션은 스키마 변경을 체계적으로 관리하는 방법으로, 버전 관리와 롤백 계획을 통해 개발/테스트/운영 환경에서 안정성을 확보합니다." },
    { id: "n14", title: "데이터베이스 클러스터링", tags: ["클러스터", "고가용성", "로드밸런싱"], duration: "02:05:37", createdAt: "2025. 4. 17, 오전 9:50", icon: "folder.png", summary: "클러스터링은 여러 서버를 연결하여 고가용성을 제공하는 기술로, 마스터-슬레이브 구조와 로드 밸런서를 통해 트래픽을 분산합니다." },
    { id: "n15", title: "데이터베이스 최신 트렌드", tags: ["트렌드", "클라우드", "AI"], duration: "01:28:45", createdAt: "2025. 4. 16, 오후 5:10", icon: "notebook.png", summary: "현재 DB 분야는 클라우드 네이티브와 AI 기반 자동화가 주요 트렌드로, 서버리스 DB와 머신러닝 기반 쿼리 최적화가 주목받고 있습니다." },
    { id: "n16", title: "데이터베이스 실습 프로젝트", tags: ["프로젝트", "실습", "포트폴리오"], duration: "03:15:22", createdAt: "2025. 4. 15, 오전 10:00", icon: "folder.png", summary: "실제 프로젝트를 통해 요구사항 분석부터 ERD 설계, 테이블 생성, 인덱스 설계, 쿼리 최적화까지 전체 DB 개발 과정을 경험했습니다." },
    { id: "n17", title: "데이터베이스 면접 준비", tags: ["면접", "기술질문", "준비"], duration: "02:45:18", createdAt: "2025. 4. 14, 오후 2:30", icon: "bookmark.png", summary: "DB 기술 면접에서 자주 나오는 정규화, 인덱스, 트랜잭션, 동시성 제어, 성능 튜닝, NoSQL vs RDBMS 비교 등 핵심 개념을 정리했습니다." },
  ],
  "ai-ml": [
    { id: "n3", title: "CNN 기본 개념", tags: ["딥러닝", "CNN"], duration: "02:38:07", createdAt: "2025. 3. 21, 오후 5:00", icon: "folder.png" },
    { id: "n4", title: "NLP 전처리", tags: ["토큰화", "정규화"], duration: "01:15:13", createdAt: "2025. 1. 25, 오후 3:43", inProgress: true, icon: "meno.png" },
  ],
  "web-dev": [
    { id: "n5", title: "React 성능 최적화", tags: ["React", "성능"], duration: "00:39:09", createdAt: "2025. 1. 23, 오후 5:33", icon: "spring-note.png" },
  ],
};

export default function FolderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const folderId = params.id;

  const notes = useMemo(() => mockNotesByFolder[folderId] ?? [], [folderId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="flex-1">
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-gray-900">기본 폴더</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>홈</span>
                  <ChevronRight className="w-4 h-4" />
                  <span>폴더</span>
                </div>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="검색어를 입력해 주세요"
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A8C7FA]"
                />
              </div>
            </div>
          </header>

          <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200">
              {notes.map((note) => (
                <div key={note.id} className="border-b last:border-b-0 border-gray-100 hover:bg-[#A8C7FA]/10">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden">
                        <Image
                          src={`/file/${note.icon}`}
                          alt="노트 아이콘"
                          width={24}
                          height={24}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900">{note.title}</div>
                      {note.summary && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 line-clamp-2">{note.summary}</p>
                        </div>
                      )}
                      <div className="mt-1 flex flex-wrap gap-2">
                        {note.tags.map((t) => (
                          <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t}</span>
                        ))}
                      </div>
                    </div>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-6">
                      <span>{note.duration}</span>
                      <span>{note.createdAt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


