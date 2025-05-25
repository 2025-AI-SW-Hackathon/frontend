"use client";

import React, { useState } from "react";
import { useAnnotation } from "./AnnotationContext";
import { Pencil } from "lucide-react";

export default function AnnotationPanel() {
  const { annotations, editAnnotation } = useAnnotation(); // ✅ editAnnotation 추가
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditValue(text);
  };

  const finishEdit = () => {
    if (editingId !== null) {
      editAnnotation(editingId, editValue); 
      setEditingId(null);
      setEditValue("");
    }
  };

  return (
    <div className="w-1/3 h-full bg-white border-l p-4 overflow-y-auto">
      <h2 className="text-lg font-bold mb-2">실시간 요약</h2>
      <div className="flex flex-col gap-2">
        {annotations.map((anno) => (
          <div
            key={anno.id}
            className="bg-blue-100 rounded p-2 shadow text-sm group flex justify-between items-center"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", JSON.stringify(anno));
            }}
          >
            {editingId === anno.id ? (
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={finishEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") finishEdit();
                }}
                autoFocus
                className="w-full bg-white border p-1 text-sm rounded"
              />
            ) : (
              <>
                <div className="flex-1">
                  {anno.text}
                  {anno.markdown && (
                    <div className="text-xs text-gray-600 mt-1">{anno.markdown}</div>
                  )}
                </div>
                <button
                  onClick={() => startEdit(anno.id, anno.text)}
                  className="ml-2 opacity-0 group-hover:opacity-100 transition"
                >
                  <Pencil size={16} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
