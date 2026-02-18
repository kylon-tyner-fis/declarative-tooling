"use client";

import { useCallback, useEffect, useState } from "react";
import { Node, Edge } from "@xyflow/react";

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface UseUndoRedoProps {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
}

export function useUndoRedo({
  nodes,
  edges,
  setNodes,
  setEdges,
}: UseUndoRedoProps) {
  const [undoStack, setUndoStack] = useState<HistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);

  // Call this BEFORE making a change to save the current state
  const takeSnapshot = useCallback(() => {
    // Limit stack size to prevent memory issues (optional, e.g., 50 steps)
    setUndoStack((prev) => {
      const newState = [...prev, { nodes, edges }];
      return newState.slice(-50);
    });
    setRedoStack([]); // Clear redo history when a new action is taken
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    // Save current state to redo stack before restoring
    setRedoStack((prev) => [...prev, { nodes, edges }]);

    // Restore previous state
    setNodes(previousState.nodes);
    setEdges(previousState.edges);

    setUndoStack(newUndoStack);
  }, [undoStack, nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    // Save current state to undo stack before restoring
    setUndoStack((prev) => [...prev, { nodes, edges }]);

    // Restore next state
    setNodes(nextState.nodes);
    setEdges(nextState.edges);

    setRedoStack(newRedoStack);
  }, [redoStack, nodes, edges, setNodes, setEdges]);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return {
    takeSnapshot,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}
