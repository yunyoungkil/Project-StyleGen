import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';

interface MaskingCanvasProps {
  tool: 'brush' | 'eraser';
  brushSize: number;
}

export interface MaskingCanvasRef {
  getMaskDataURL: () => string | null;
  clearMask: () => void;
  invertMask: () => void;
}

const MASK_COLOR = 'rgba(168, 85, 247, 1)'; // purple-500

const MaskingCanvas = forwardRef<MaskingCanvasRef, MaskingCanvasProps>(
  ({ tool, brushSize }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPoint, setLastPoint] = useState<{ x: number, y: number } | null>(null);

    const getCanvasContext = () => {
      const canvas = canvasRef.current;
      return canvas ? canvas.getContext('2d') : null;
    }

    const setCanvasDimensions = () => {
        const canvas = canvasRef.current;
        const parent = canvas?.parentElement;
        if (canvas && parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
    }

    useEffect(() => {
        setCanvasDimensions();
        window.addEventListener('resize', setCanvasDimensions);
        return () => window.removeEventListener('resize', setCanvasDimensions);
    }, []);

    const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
        const ctx = getCanvasContext();
        if (!ctx) return;

        ctx.strokeStyle = MASK_COLOR;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = tool === 'brush' ? 'source-over' : 'destination-out';

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const pos = getMousePos(e);
        setLastPoint(pos);
        // Draw a dot for single clicks
        drawLine(pos.x, pos.y, pos.x, pos.y);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const currentPos = getMousePos(e);
        if (lastPoint) {
            drawLine(lastPoint.x, lastPoint.y, currentPos.x, currentPos.y);
        }
        setLastPoint(currentPos);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        setLastPoint(null);
    };

    useImperativeHandle(ref, () => ({
      getMaskDataURL: () => {
        const canvas = canvasRef.current;
        const ctx = getCanvasContext();
        if (!canvas || !ctx) return null;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let hasMask = false;
        for (let i = 3; i < data.length; i += 4) { // Check alpha channel
            if (data[i] > 0) {
                hasMask = true;
                break;
            }
        }
        return hasMask ? canvas.toDataURL('image/png') : null;
      },
      clearMask: () => {
        const canvas = canvasRef.current;
        const ctx = getCanvasContext();
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      },
      invertMask: () => {
        const canvas = canvasRef.current;
        const ctx = getCanvasContext();
        if (canvas && ctx) {
            ctx.globalCompositeOperation = 'xor';
            ctx.fillStyle = MASK_COLOR;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }));

    return (
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="absolute inset-0 w-full h-full opacity-50 z-10"
        style={{ cursor: 'crosshair' }}
      />
    );
  }
);

export default MaskingCanvas;