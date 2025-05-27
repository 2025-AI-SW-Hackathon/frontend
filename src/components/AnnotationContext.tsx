"use client";

import React, { createContext, useContext, useState } from "react";

interface Annotation {
  id: string;
  text: string;
  markdown?: string | null;
}

interface AnnotationContextType {
  annotations: Annotation[];
  addAnnotation: (a: Annotation) => void;
  editAnnotation: (id: string, newText: string) => void;
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>; // ✅ 추가
}

const AnnotationContext = createContext<AnnotationContextType | null>(null);

export function AnnotationProvider({ children }: { children: React.ReactNode }) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const addAnnotation = (a: Annotation) => {
    try {
      const parsed = JSON.parse(a.text);
      const paragraphs: string[] = (parsed.refinedText ?? "")
      .split(/\n\s*\n/)
      .map((para: string) => para.trim())
      .filter(Boolean);
  
      if (paragraphs.length > 1) {
        setAnnotations((prev) => [
          ...prev,
          ...paragraphs.map((para, idx) => ({
            id: `${a.id}-p${idx}`,
            text: JSON.stringify({ refinedText: para }),
            markdown: a.markdown ?? null,
          })),
        ]);
        return;
      }
    } catch {
      // JSON 파싱 실패 → 단일 주석으로 추가
    }
  
    setAnnotations((prev) => [...prev, a]);
  };
  
  

  const editAnnotation = (id: string, newText: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, text: newText } : a))
    );
  };

  return (
    <AnnotationContext.Provider
      value={{ annotations, addAnnotation, editAnnotation, setAnnotations }} // ✅ 추가됨
    >
      {children}
    </AnnotationContext.Provider>
  );
}

export const useAnnotation = () => {
  const context = useContext(AnnotationContext);
  if (!context)
    throw new Error("useAnnotation must be used within AnnotationProvider");
  return context;
};
