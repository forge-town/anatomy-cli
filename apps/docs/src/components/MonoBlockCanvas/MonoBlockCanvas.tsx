import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 520;
const GRID_COLUMNS = 36;
const GRID_ROWS = 26;

const glyphs = [
  {
    color: "#26352e",
    columns: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    offset: 3,
  },
  {
    color: "#d5ef91",
    columns: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    offset: 14,
  },
  {
    color: "#d9654b",
    columns: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    offset: 25,
  },
] as const;

export type MonoBlockCanvasProps = {
  className?: string;
};

export const MonoBlockCanvas = ({ className }: MonoBlockCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: -10, y: -10 });
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || import.meta.env.MODE === "test") {
      if (!context) setSupported(false);
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;
    let time = 0;
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const drawGlyph = () => {
      const cellWidth = CANVAS_WIDTH / GRID_COLUMNS;
      const cellHeight = CANVAS_HEIGHT / GRID_ROWS;
      glyphs.forEach((glyph, glyphIndex) => {
        glyph.columns.forEach((row, rowIndex) => {
          Array.from(row).forEach((cell, columnIndex) => {
            if (cell !== "1") return;
            const pulse = Math.sin(time * 0.002 + rowIndex + columnIndex * 0.7);
            const offsetX = pulse > 0.82 && !reduceMotion ? 2 : 0;
            const offsetY = pulse < -0.86 && !reduceMotion ? -2 : 0;
            context.fillStyle = glyph.color;
            context.fillRect(
              (glyph.offset + columnIndex) * cellWidth + 2 + offsetX,
              (9 + rowIndex) * cellHeight + 2 + offsetY,
              cellWidth - 4,
              cellHeight - 4,
            );
            if ((rowIndex + columnIndex + glyphIndex) % 5 === 0) {
              context.fillStyle = "#f2efe8";
              context.fillRect(
                (glyph.offset + columnIndex) * cellWidth + cellWidth * 0.38,
                (9 + rowIndex) * cellHeight + cellHeight * 0.38,
                cellWidth * 0.24,
                cellHeight * 0.24,
              );
            }
          });
        });
      });
    };
    const draw = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 1;
      const height = rect.height || 1;
      const cellWidth = width / GRID_COLUMNS;
      const cellHeight = height / GRID_ROWS;
      if (!reduceMotion) time = now;
      context.fillStyle = "#f2efe8";
      context.fillRect(0, 0, width, height);
      context.strokeStyle = "rgba(38, 53, 46, 0.12)";
      context.lineWidth = 1;
      for (let column = 0; column <= GRID_COLUMNS; column += 1) {
        context.beginPath();
        context.moveTo(column * cellWidth, 0);
        context.lineTo(column * cellWidth, height);
        context.stroke();
      }
      for (let row = 0; row <= GRID_ROWS; row += 1) {
        context.beginPath();
        context.moveTo(0, row * cellHeight);
        context.lineTo(width, row * cellHeight);
        context.stroke();
      }
      for (let row = 0; row < GRID_ROWS; row += 1) {
        for (let column = 0; column < GRID_COLUMNS; column += 1) {
          const signal =
            Math.sin(column * 0.72 + time * 0.00075) + Math.cos(row * 0.9 - time * 0.00055);
          const pointerDistance = Math.hypot(
            column - pointerRef.current.x,
            row - pointerRef.current.y,
          );
          if (signal > 1.5 || pointerDistance < 2.2) {
            context.fillStyle = pointerDistance < 2.2 ? "#d9654b" : "rgba(38, 53, 46, 0.16)";
            context.fillRect(
              column * cellWidth + 5,
              row * cellHeight + 5,
              Math.max(1, cellWidth - 10),
              Math.max(1, cellHeight - 10),
            );
          }
        }
      }
      const scaleX = width / CANVAS_WIDTH;
      const scaleY = height / CANVAS_HEIGHT;
      context.save();
      context.scale(scaleX, scaleY);
      drawGlyph();
      context.restore();
      if (!reduceMotion) animationFrame = window.requestAnimationFrame(draw);
    };
    const observer = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
    observer?.observe(canvas);
    resize();
    draw(0);
    return () => {
      cancelAnimationFrame(animationFrame);
      observer?.disconnect();
    };
  }, []);

  if (!supported) {
    return (
      <div
        className={cn(
          "grid min-h-[260px] place-items-center bg-[#f2efe8] p-8 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#26352e]/60",
          className,
        )}
        role="img"
        aria-label="结构预览不可用"
      >
        结构预览不可用
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn("block h-full min-h-[260px] w-full bg-[#f2efe8]", className)}
      height={CANVAS_HEIGHT}
      width={CANVAS_WIDTH}
      role="img"
      aria-label="由动态像素方块组成的 Anatomy 结构字场"
      onPointerLeave={() => {
        pointerRef.current = { x: -10, y: -10 };
      }}
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        pointerRef.current = {
          x: ((event.clientX - bounds.left) / bounds.width) * GRID_COLUMNS,
          y: ((event.clientY - bounds.top) / bounds.height) * GRID_ROWS,
        };
      }}
    />
  );
};

MonoBlockCanvas.displayName = "MonoBlockCanvas";
