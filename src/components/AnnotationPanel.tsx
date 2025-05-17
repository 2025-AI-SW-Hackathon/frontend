"use client";

import React, { useEffect, useState } from "react";

interface Annotation {
  id: string;
  text: string;
}

export default function AnnotationPanel() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  useEffect(() => {
    const mockTexts = [
      "이건 첫 번째 요약 문장입니다.",
      "교수님이 강조한 핵심 개념이에요.",
      "중요! 이건 시험에 나올 가능성 있음.",
      "예시를 통해 이해하면 좋아요.",
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < mockTexts.length) {
        setAnnotations((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            text: mockTexts[index],
          },
        ]);
        index++;
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-1/3 h-full bg-white border-l p-4 overflow-y-auto">
      <h2 className="text-lg font-bold mb-2">실시간 요약</h2>
      <div className="flex flex-col gap-2">
        {annotations.map((anno) => (
          <div
            key={anno.id}
            className="bg-blue-100 rounded p-2 shadow text-sm cursor-move"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", JSON.stringify(anno));
            }}
          >
            {anno.text}
          </div>
        ))}
      </div>
    </div>
  );
}
