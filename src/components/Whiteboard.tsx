import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Trash2 } from 'lucide-react';

interface WhiteboardProps {
  socket: Socket | null;
  roomId: string;
  initialHistory: any[];
}

export default function Whiteboard({ socket, roomId, initialHistory }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const prevPos = useRef<{ x: number; y: number } | null>(null);
  const drawHistoryRef = useRef<any[]>(initialHistory);

  useEffect(() => {
    drawHistoryRef.current = initialHistory;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) redraw(ctx, canvas);
    }
  }, [initialHistory]);

  const redraw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawHistoryRef.current.forEach((data) => {
      ctx.beginPath();
      ctx.strokeStyle = data.color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(data.prevX, data.prevY);
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
      ctx.closePath();
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          canvas.width = width;
          canvas.height = height;
          
          // Redraw everything from history
          redraw(ctx, canvas);
          
          // Set default styles after resize
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }
    };

    const observer = new ResizeObserver(resize);
    const parent = canvas.parentElement;
    if (parent) {
      observer.observe(parent);
    }

    if (socket) {
      const handleDrawUpdate = (data: any) => {
        drawHistoryRef.current.push(data);
        drawLine(data.prevX, data.prevY, data.x, data.y, data.color, false);
      };

      const handleDrawCleared = () => {
        drawHistoryRef.current = [];
        clearCanvas(false);
      };

      socket.on('draw:update', handleDrawUpdate);
      socket.on('draw:cleared', handleDrawCleared);

      return () => {
        observer.disconnect();
        socket.off('draw:update', handleDrawUpdate);
        socket.off('draw:cleared', handleDrawCleared);
      };
    }

    return () => {
      observer.disconnect();
    };
  }, [socket]);

  const drawLine = (x1: number, y1: number, x2: number, y2: number, lineColor: string, emit: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();

    if (emit) {
      const drawData = {
        roomId,
        x: x2,
        y: y2,
        prevX: x1,
        prevY: y1,
        color: lineColor
      };
      drawHistoryRef.current.push(drawData);
      if (socket) {
        socket.emit('draw:line', drawData);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    prevPos.current = { x, y };
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !prevPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawLine(prevPos.current.x, prevPos.current.y, x, y, color, true);
    prevPos.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    prevPos.current = null;
  };

  const startTouchDrawing = (e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setIsDrawing(true);
    prevPos.current = { x, y };
  };

  const touchDraw = (e: React.TouchEvent) => {
    if (!isDrawing || !prevPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    drawLine(prevPos.current.x, prevPos.current.y, x, y, color, true);
    prevPos.current = { x, y };
  };

  const clearCanvas = (emit: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (emit && socket) {
      socket.emit('draw:clear', roomId);
    }
  };

  return (
    <div className="w-full h-full relative bg-zinc-950 overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 flex items-center gap-2 p-2 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl z-10">
        <div className="flex items-center gap-2 px-2 border-r border-zinc-800 mr-2">
          {['#ffffff', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button
          onClick={() => clearCanvas(true)}
          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all flex items-center gap-2 text-xs font-medium"
          title="Clear Board"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startTouchDrawing}
        onTouchMove={touchDraw}
        onTouchEnd={stopDrawing}
        className="w-full h-full cursor-crosshair touch-none"
      />
    </div>
  );
}
