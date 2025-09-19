import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * 간소화 드로잉 훅(브러시/지우개)
 * - dCanvas(오프스크린)에 실제 픽셀을 저장, 표시용 canvas는 항상 리사이즈에 맞춰 '프레젠트'
 * - 컨테이너 리사이즈 시 즉시 표시(먹통영역 방지)
 */
export default function useCanvasDrawing({
  tool = 'brush',           // 'brush' | 'eraser'
  color = '#111', size = 6, // 브러시 색/두께
  eraserSize = 18,          // 지우개 두께
  enabled = true,
  onRadialOpen,             // (선택) 우클릭/롱프레스 콜백 (x,y)
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  // 오프스크린 문서
  const dCanvasRef = useRef(/** @type {HTMLCanvasElement} */(document.createElement('canvas')));
  const dCtxRef = useRef(/** @type {CanvasRenderingContext2D} */(dCanvasRef.current.getContext('2d', { willReadFrequently:true })));

  // 뷰 포트(표시 스케일/오프셋)
  const viewRef = useRef({ W:0, H:0, dpr: 1 });

  const [isDrawing, setIsDrawing] = useState(false);
  const lastRef = useRef(null);

  // 표시 갱신
  const present = useCallback(() => {
    const cvs = canvasRef.current;
    const ctx = ctxRef.current;
    const d = dCanvasRef.current;
    if (!cvs || !ctx || !d) return;
    ctx.clearRect(0,0,cvs.width,cvs.height);
    ctx.drawImage(d, 0, 0, cvs.width, cvs.height);
  }, []);

  // 리사이즈 옵저버
  useEffect(() => {
    const cvs = canvasRef.current;
    const container = containerRef.current;
    if (!cvs || !container) return;

    const onResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
      viewRef.current = { W: Math.max(1, Math.round(rect.width)), H: Math.max(1, Math.round(rect.height)), dpr };
      cvs.width  = Math.round(viewRef.current.W * dpr);
      cvs.height = Math.round(viewRef.current.H * dpr);
      cvs.style.width  = `${viewRef.current.W}px`;
      cvs.style.height = `${viewRef.current.H}px`;
      ctxRef.current = cvs.getContext('2d');
      present();
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(container);
    onResize();
    return () => ro.disconnect();
  }, [present]);

  // 좌표 변환(표시→문서)
  const toDoc = useCallback((x, y) => {
    const { W, H } = viewRef.current;
    const d = dCanvasRef.current;
    if (!d.width || !d.height) {
      // 최초 문서 크기(표시 크기 기준 1:1)
      d.width = Math.max(512, W|0);
      d.height = Math.max(512, H|0);
    }
    return {
      x: (x / W) * d.width,
      y: (y / H) * d.height,
    };
  }, []);

  // 포인터 핸들러
  const begin = useCallback((e) => {
    if (!enabled) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    lastRef.current = toDoc(x, y);
    setIsDrawing(true);
  }, [enabled, toDoc]);

  const move = useCallback((e) => {
    if (!enabled || !isDrawing || !lastRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const p = toDoc(x, y);

    const dctx = dCtxRef.current;
    dctx.lineCap = 'round';
    dctx.lineJoin = 'round';
    if (tool === 'eraser') {
      dctx.globalCompositeOperation = 'destination-out';
      dctx.strokeStyle = 'rgba(0,0,0,1)';
      dctx.lineWidth = eraserSize;
    } else {
      dctx.globalCompositeOperation = 'source-over';
      dctx.strokeStyle = color;
      dctx.lineWidth = size;
    }

    dctx.beginPath();
    dctx.moveTo(lastRef.current.x, lastRef.current.y);
    dctx.lineTo(p.x, p.y);
    dctx.stroke();

    lastRef.current = p;
    present();
  }, [enabled, isDrawing, tool, color, size, eraserSize, toDoc, present]);

  const end = useCallback(() => {
    if (!enabled) return;
    setIsDrawing(false);
    lastRef.current = null;
  }, [enabled]);

  // 컨텍스트 메뉴(라디얼)
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onCtx = (e) => {
      if (!onRadialOpen) return;
      e.preventDefault();
      onRadialOpen(e.clientX, e.clientY);
    };
    el.addEventListener('contextmenu', onCtx);
    return () => el.removeEventListener('contextmenu', onCtx);
  }, [onRadialOpen]);

  // 이벤트 바인딩
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('pointerdown', begin);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    return () => {
      el.removeEventListener('pointerdown', begin);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
    };
  }, [begin, move, end]);

  return { containerRef, canvasRef, present };
}
