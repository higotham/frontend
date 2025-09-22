// src/services/useCanvasDrawing.js
import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * ✅ 브러시/지우개 + 히스토리 + 라디얼 + 내보내기
 * ✅ 🔧 리사이즈 시 doc(오프스크린 캔버스)을 컨테이너 크기에 "스트레치"로 맞춤
 *     - 기존 래스터 내용은 drawImage로 스케일
 *     - 벡터(경로/지우개) 좌표와 두께도 동일 비율로 스케일
 *     → 비율 변경 후에도 상/하/좌/우 "먹통 영역"이 생기지 않음
 */
export default function useCanvasDrawing({
  tool,                 // 'brush' | 'eraser'
  eraserSize,           // number(px)
  color, size,          // brush color/size
  stroke, fill, strokeWidth, // (호환 잔재) 미사용
  enabled,
  onRadialOpen,         // (x,y) => void (선택)
}) {
  const containerRef = useRef(null), canvasRef = useRef(null), ctxRef = useRef(null);
  const docRef = useRef(null), dctxRef = useRef(null);
  const viewRef = useRef({ scaleCss:1, dxCss:0, dyCss:0, W:0, H:0, dpr:1 });

  const cssToDoc = (px) => Math.max(1, px / (viewRef.current.scaleCss || 1));
  const dpr = () => Math.max(1, window.devicePixelRatio || 1);

  // ── 렌더 스케줄러
  const presentCbRef = useRef(() => {}), rafRef = useRef(0);
  const schedulePresent = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(() => { rafRef.current = 0; presentCbRef.current(); }); };

  // ── 커서 링
  const rFrom = (t, e, s) => Math.max(2, Math.round((((t==='eraser' ? (e ?? s) : s) ?? 8) / 2)));
  const cursorRafRef = useRef(0);
  const cursorNextRef = useRef({ x:0, y:0, visible:false, rCss: rFrom(tool, eraserSize, size) });
  const [cursor, setCursor] = useState({ x:0, y:0, visible:false, rCss:rFrom(tool, eraserSize, size) });
  const flushCursor = () => { cursorRafRef.current = 0; setCursor({ ...cursorNextRef.current }); };
  const updateCursor = (next) => { Object.assign(cursorNextRef.current, next); if (!cursorRafRef.current) cursorRafRef.current = requestAnimationFrame(flushCursor); };
  useEffect(() => setCursor(c => ({ ...c, rCss: rFrom(tool, eraserSize, size) })), [size, eraserSize, tool]);

  // ── 벡터/히스토리
  const vecRef = useRef([]);            // {id,type:'path',points:[],stroke,strokeWidth,erasers:[{size,points:[]}]}
  const creatingRef = useRef(null);
  const erasingRef  = useRef(null);
  const clone = (v) => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));
  const historyRef = useRef([]); const [historyCount, setHistoryCount] = useState(0); const MAX_HIST = 80;

  const snapshot = () => {
    try {
      const doc = docRef.current, img = dctxRef.current.getImageData(0,0,doc.width,doc.height);
      return { w:doc.width, h:doc.height, img, vec: clone(vecRef.current) };
    } catch { return null; }
  };
  const pushHistory = () => { const s = snapshot(); if (!s) return; const arr = historyRef.current; if (arr.length >= MAX_HIST) arr.shift(); arr.push(s); setHistoryCount(arr.length); };
  const pushHistoryAsync = () => {
    const run = () => { try { pushHistory(); } catch {} };
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 120 }); else requestAnimationFrame(run);
  };
  const restore = (s) => {
    if (!s) return false;
    const { w,h,img,vec } = s;
    const off = document.createElement('canvas'); off.width=w; off.height=h;
    const dctx = off.getContext('2d', { willReadFrequently: true });
    try { dctx.putImageData(img,0,0); } catch { return false; }
    docRef.current=off; dctxRef.current=dctx; vecRef.current = clone(vec || []);
    recomputeView(); schedulePresent(); return true;
  };
  const undo = () => { const arr = historyRef.current; if (!arr.length) return; const s = arr.pop(); setHistoryCount(arr.length); restore(s); };

  // ── 초기 문서 생성
  const ensureDoc = useCallback((wCss,hCss)=>{
    if (docRef.current) return;
    const _dpr = dpr();
    const off = document.createElement('canvas'); off.width=(wCss*_dpr)|0; off.height=(hCss*_dpr)|0;
    const dctx = off.getContext('2d',{willReadFrequently:true});
    dctx.fillStyle='#fff'; dctx.fillRect(0,0,off.width,off.height);
    docRef.current=off; dctxRef.current=dctx;
  },[]);

  // ── 벡터/지우개 오브젝트 스케일링
  const scaleVectorObjects = (sx, sy) => {
    if (sx === 1 && sy === 1) return;
    const sL = Math.max(0.5, (sx + sy) / 2); // 선 두께는 평균 배율
    for (const o of vecRef.current) {
      if (o.points) for (const p of o.points){ p.x *= sx; p.y *= sy; }
      if (o.strokeWidth) o.strokeWidth = Math.max(1, o.strokeWidth * sL);
      if (o.erasers) for (const er of o.erasers){
        if (er.points) for (const p of er.points){ p.x *= sx; p.y *= sy; }
        if (er.size) er.size = Math.max(1, er.size * sL);
      }
    }
  };

  // ── 뷰/리사이즈: ★ 핵심 – doc을 컨테이너 크기에 맞춰 "스트레치"로 재샘플
  const recomputeView = useCallback(() => {
    const cont = containerRef.current, canvas = canvasRef.current, doc = docRef.current; if (!cont || !canvas || !doc) return;
    const W = Math.max(1, cont.clientWidth), H = Math.max(1, cont.clientHeight), _dpr = dpr();

    // 1) 화면 캔버스 크기 갱신
    canvas.width = Math.floor(W*_dpr); canvas.height = Math.floor(H*_dpr);
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;

    // 2) 문서(doc) 크기를 컨테이너에 "완전 일치" 되도록 스케일(레터박스 제거)
    const targetW = Math.max(1, Math.round(W*_dpr));
    const targetH = Math.max(1, Math.round(H*_dpr));
    if (doc.width !== targetW || doc.height !== targetH) {
      // 히스토리 보관 후 스케일
      pushHistory();
      const old = doc;
      const nx = document.createElement('canvas'); nx.width = targetW; nx.height = targetH;
      const nd = nx.getContext('2d',{willReadFrequently:true});
      nd.fillStyle='#fff'; nd.fillRect(0,0,targetW,targetH);
      // 기존 내용을 스트레치로 전체에 채우기
      nd.drawImage(old, 0, 0, old.width, old.height, 0, 0, targetW, targetH);

      // 벡터/지우개 경로 좌표 및 두께도 동일 비율 스케일
      const sx = targetW / old.width, sy = targetH / old.height;
      scaleVectorObjects(sx, sy);

      docRef.current = nx; dctxRef.current = nd;
    }

    // 3) 뷰 매트릭스: doc과 컨테이너 비율이 동일하므로 레터박스/오프셋=0
    const scaleCss = 1 / _dpr; // doc(px) → CSS px
    viewRef.current = { scaleCss, dxCss:0, dyCss:0, W, H, dpr:_dpr };
    schedulePresent();
  }, []);

  // ── 보조 유틸
  const bboxOfPath = (pts, pad=1) => {
    if (!pts?.length) return {x:0,y:0,w:0,h:0};
    let minx=pts[0].x,maxx=pts[0].x,miny=pts[0].y,maxy=pts[0].y;
    for (const p of pts){ if (p.x<minx) minx=p.x; if (p.x>maxx) maxx=p.x; if (p.y<miny) miny=p.y; if (p.y>maxy) maxy=p.y; }
    return { x:minx-pad, y:miny-pad, w:(maxx-minx)+pad*2, h:(maxy-miny)+pad*2 };
  };
  const unionBBox = (a,b)=>({ x:Math.min(a.x,b.x), y:Math.min(a.y,b.y), w:Math.max(a.x+a.w,b.x+b.w)-Math.min(a.x,b.x), h:Math.max(a.y+a.h,b.y+b.h)-Math.min(a.y,b.y) });

  const drawObjectDocPure = (ctx, o) => {
    const stroked = o.stroke && o.strokeWidth>0;
    ctx.save(); ctx.lineWidth=Math.max(1,o.strokeWidth); ctx.lineJoin='round'; ctx.lineCap='round'; if (stroked) ctx.strokeStyle=o.stroke;
    if (o.type==='path' && o.points?.length>1){ ctx.beginPath(); ctx.moveTo(o.points[0].x, o.points[0].y); for (let i=1;i<o.points.length;i++){ const p=o.points[i]; ctx.lineTo(p.x, p.y); } if (stroked) ctx.stroke(); }
    ctx.restore();
  };

  const maskedAlphaBBox = (o) => {
    let bb = bboxOfPath(o.points||[], Math.max(2,(o.strokeWidth||2)/2 + 2));
    if (o.erasers?.length) for (const er of o.erasers) bb = unionBBox(bb, bboxOfPath(er.points||[], Math.max(2,(er.size||8)/2 + 2)));
    bb = { x:Math.floor(bb.x-1), y:Math.floor(bb.y-1), w:Math.max(1,Math.ceil(bb.w+2)), h:Math.max(1,Math.ceil(bb.h+2)) };
    const off = document.createElement('canvas'); off.width=bb.w; off.height=bb.h;
    const cx = off.getContext('2d',{willReadFrequently:true}); cx.save(); cx.translate(-bb.x,-bb.y); drawObjectDocPure(cx,o);
    if (o.erasers?.length) for (const er of o.erasers){ if (!er.points?.length) continue; cx.save(); cx.globalCompositeOperation='destination-out'; cx.lineCap='round'; cx.lineJoin='round'; cx.lineWidth=Math.max(1,er.size||8); cx.beginPath(); const ps=er.points; cx.moveTo(ps[0].x,ps[0].y); for (let i=1;i<ps.length;i++) cx.lineTo(ps[i].x,ps[i].y); cx.stroke(); cx.restore(); }
    cx.restore();
    const { data } = cx.getImageData(0,0,off.width,off.height);
    let minx=off.width,miny=off.height,maxx=-1,maxy=-1,has=false;
    for (let y=0;y<off.height;y++) for (let x=0;x<off.width;x++){ const a=data[(y*off.width+x)*4+3]; if (a>0){ has=true; if(x<minx)minx=x; if(y<miny)miny=y; if(x>maxx)maxx=x; if(y>maxy)maxy=y; } }
    return has ? { empty:false, bbox:{ x:bb.x+minx, y:bb.y+miny, w:maxx-minx+1, h:maxy-miny+1 } } : { empty:true, bbox:null };
  };

  // ── 마운트 & 프레젠트
  useEffect(() => {
    if (!enabled) return;
    const cont = containerRef.current, canvas = canvasRef.current; if (!cont || !canvas) return;
    ctxRef.current = canvas.getContext('2d', { willReadFrequently: true });

    ensureDoc(cont.clientWidth, cont.clientHeight);

    const present = () => {
      const { scaleCss:s, dxCss, dyCss, W, H, dpr:_dpr } = viewRef.current, ctx = ctxRef.current, doc = docRef.current;
      if (!ctx || !doc) return;
      ctx.setTransform(_dpr,0,0,_dpr,0,0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = isDrawingRef.current ? 'low' : 'high';

      // 배경
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);

      // doc → 화면(레터박스 없음; dx/dy=0)
      ctx.drawImage(doc, 0, 0, doc.width, doc.height, dxCss, dyCss, doc.width*s, doc.height*s);

      const drawScreen = (o) => {
        const stroked = o.stroke && o.strokeWidth>0;
        ctx.save(); ctx.lineWidth=Math.max(1,o.strokeWidth*s); ctx.lineJoin='round'; ctx.lineCap='round'; if (stroked) ctx.strokeStyle=o.stroke;
        if (o.type==='path' && o.points?.length>1){
          ctx.beginPath(); for (let i=0;i<o.points.length;i++){ const p=o.points[i]; const x=p.x*s, y=p.y*s; if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }
          if (stroked) ctx.stroke();
        }
        ctx.restore();
      };

      const drawWithErasers = (o) => {
        let bb = bboxOfPath(o.points||[], Math.max(2,(o.strokeWidth||2)/2 + 2));
        if (o.erasers?.length) for (const er of o.erasers) bb = unionBBox(bb, bboxOfPath(er.points||[], Math.max(2,(er.size||8)/2 + 2)));
        bb.w = Math.max(1, Math.ceil(bb.w)); bb.h = Math.max(1, Math.ceil(bb.h));
        const off = document.createElement('canvas'); off.width=bb.w; off.height=bb.h;
        const octx = off.getContext('2d',{willReadFrequently:true});
        octx.save(); octx.translate(-bb.x,-bb.y); drawObjectDocPure(octx,o);
        if (o.erasers?.length) for (const er of o.erasers){ if (!er.points?.length) continue; octx.save(); octx.globalCompositeOperation='destination-out'; octx.lineCap='round'; octx.lineJoin='round'; octx.lineWidth=Math.max(1,er.size||8); octx.beginPath(); const ps=er.points; octx.moveTo(ps[0].x,ps[0].y); for (let i=1;i<ps.length;i++) octx.lineTo(ps[i].x,ps[i].y); octx.stroke(); octx.restore(); }
        octx.restore(); ctx.drawImage(off, bb.x*s, bb.y*s, off.width*s, off.height*s);
      };

      for (const o of vecRef.current) (o.erasers?.length ? drawWithErasers : drawScreen)(o);
      if (creatingRef.current) (creatingRef.current.erasers?.length ? drawWithErasers : drawScreen)(creatingRef.current);
    };
    presentCbRef.current = present;

    // 첫 계산 + 옵저버
    recomputeView();
    const ro = new ResizeObserver(recomputeView);
    ro.observe(cont);
    return () => { ro.disconnect(); if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = 0; };
  }, [enabled, ensureDoc, recomputeView]);

  // ── 좌표(레터박스가 없으므로 단순)
  const toDocXY = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX, clientY = e.clientY ?? e.touches?.[0]?.clientY;
    const xCss = clientX - rect.left, yCss = clientY - rect.top;
    const { scaleCss } = viewRef.current;
    const x = xCss / scaleCss, y = yCss / scaleCss;
    return { x, y, shift:e.shiftKey, alt:e.altKey };
  };
  const toCssXY = (e) => {
    const rect = containerRef.current?.getBoundingClientRect?.(); if (!rect) return {x:0,y:0};
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0, clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  // ── 드로잉 상태
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef(false);
  useEffect(() => { isDrawingRef.current = isDrawing; }, [isDrawing]);

  // ── 라디얼(롱프레스/우클릭)
  const LONG_MS = 520, MOVE_TOL = 6;
  const lpRef = useRef({ timer:null, startX:0, startY:0 });
  const openRadialAt = useCallback((x, y) => {
    if (typeof onRadialOpen === 'function') onRadialOpen(x, y);
    else {
      const ev = new CustomEvent('aiw:radial-open', { bubbles: true, detail: { x, y } });
      canvasRef.current?.dispatchEvent?.(ev);
    }
  }, [onRadialOpen]);

  // ── 지우개 히트테스트
  const bboxPad = (o) => Math.max(2,(o.strokeWidth||2)/2 + 2);
  const erPad   = (er) => Math.max(2,(er.size||8)/2 + 2);
  const hitObjectsAt = (x, y, radiusDoc) => {
    const res = [];
    for (const o of vecRef.current) {
      if (o.type !== 'path') continue;
      const tol = Math.max(radiusDoc, (o.strokeWidth || 1) / 2);
      let ok = false;
      if (o.points?.length > 1) {
        for (let k = 1; k < o.points.length; k++) {
          const p1 = o.points[k - 1], p2 = o.points[k];
          const A=x-p1.x,B=y-p1.y,C=p2.x-p1.x,D=p2.y-p1.y;
          const dot=A*C+B*D,len=C*C+D*D; let t=len?dot/len:-1; t=Math.max(0,Math.min(1,t));
          const qx=p1.x+C*t,qy=p1.y+D*t;
          if (Math.hypot(x-qx,y-qy) <= tol) { ok = true; break; }
        }
      }
      if (!ok) {
        const bb = bboxOfPath(o.points||[], Math.max(1,(o.strokeWidth||1)/2));
        if (x >= bb.x - tol && x <= bb.x + bb.w + tol && y >= bb.y - tol && y <= bb.y + bb.h + tol) ok = true;
      }
      if (ok) res.push(o);
    }
    return res;
  };

  // ── 포인터 핸들러
  const onPointerDown = (e) => {
    if (!enabled) return;

    // 우클릭 → 라디얼
    if (e.button === 2) { e.preventDefault?.(); openRadialAt(e.clientX ?? 0, e.clientY ?? 0); return; }

    e.preventDefault?.();
    updateCursor({ ...toCssXY(e), visible:true });

    try { canvasRef.current?.setPointerCapture?.(e.pointerId); } catch {}
    pushHistoryAsync();

    // 롱프레스 준비
    if ((e.button === 0) || e.pointerType === 'touch' || e.pointerType === 'pen') {
      if (lpRef.current.timer) clearTimeout(lpRef.current.timer);
      lpRef.current = { timer: null, startX: e.clientX ?? 0, startY: e.clientY ?? 0 };
      lpRef.current.timer = setTimeout(() => {
        creatingRef.current = null; erasingRef.current = null; setIsDrawing(false); schedulePresent(); undo();
        openRadialAt(lpRef.current.startX, lpRef.current.startY);
      }, LONG_MS);
    }

    const { x, y } = toDocXY(e);
    const strokeCol = (color ?? stroke ?? '#111');

    if (tool === 'eraser') {
      const sizeDoc = cssToDoc((eraserSize ?? size) || 8);
      const strokeE = { size: sizeDoc, points: [{ x, y }] };
      const targets = hitObjectsAt(x, y, sizeDoc / 2);
      const ids = new Set();
      for (const o of targets) { (o.erasers || (o.erasers = [])).push(strokeE); ids.add(o.id); }
      erasingRef.current = { targetIds: ids, stroke: strokeE };
      setIsDrawing(true); schedulePresent(); return;
    }

    const id = 'p_' + Math.random().toString(36).slice(2,8) + Date.now().toString(36);
    const sw = cssToDoc(size || 2);
    const pts = [{ x, y }], bb = bboxOfPath(pts, sw);
    creatingRef.current = { id, type:'path', points: pts, closed:false, stroke: strokeCol, fill:'none', strokeWidth: sw, x:bb.x, y:bb.y, w:bb.w, h:bb.h, erasers: [] };
    setIsDrawing(true); schedulePresent();
  };

  
const onPointerMove = (e) => {
  // UI cursor update (last event is fine for visual)
  updateCursor({ ...toCssXY(e), visible: true });

  // Cancel long-press if moved
  if (lpRef.current.timer) {
    const dx = Math.abs((e.clientX ?? 0) - lpRef.current.startX);
    const dy = Math.abs((e.clientY ?? 0) - lpRef.current.startY);
    if (dx > MOVE_TOL || dy > MOVE_TOL) { clearTimeout(lpRef.current.timer); lpRef.current.timer = null; }
  }

  if (!isDrawing) return;

  // In some browsers mouse may report buttons=0 spuriously
  if ('buttons' in e && e.buttons === 0 && e.pointerType === 'mouse') { onPointerUp(e); return; }

  const batch = (typeof e.getCoalescedEvents === 'function') ? e.getCoalescedEvents() : [e];

  for (const ev of batch) {
    const { x, y } = toDocXY(ev);

    if (tool === 'eraser') {
      const cur = erasingRef.current || { targetIds: new Set(), stroke: { size: cssToDoc((eraserSize ?? size) || 8), points: [] } };
      cur.stroke.points.push({ x, y });
      const radius = cur.stroke.size / 2;
      const hits = hitObjectsAt(x, y, radius);
      for (const o of hits) {
        if (!cur.targetIds.has(o.id)) { (o.erasers || (o.erasers = [])).push(cur.stroke); cur.targetIds.add(o.id); }
      }
      erasingRef.current = cur;
      continue;
    }

    const cur = creatingRef.current; if (!cur || cur.type !== 'path') continue;
    cur.points.push({ x, y });
    const bb = bboxOfPath(cur.points, cur.strokeWidth);
    cur.x = bb.x; cur.y = bb.y; cur.w = bb.w; cur.h = bb.h;
  }

  // single present for the whole batch
  schedulePresent();
};


  const onPointerUp = (e) => {
    if (lpRef.current.timer) { clearTimeout(lpRef.current.timer); lpRef.current.timer = null; }
    if (!isDrawing) return; setIsDrawing(false);
    try { if (e?.pointerId!=null) canvasRef.current?.releasePointerCapture?.(e.pointerId); } catch {}
    updateCursor({ visible:true });

    if (tool === 'eraser') {
      const ids = Array.from(erasingRef.current?.targetIds || []);
      erasingRef.current = null;
      if (ids.length) {
        let changed = false;
        for (const id of ids) {
          const o = vecRef.current.find(v => v.id === id);
          if (!o) continue;
          const res = maskedAlphaBBox(o);
          if (res.empty) { vecRef.current = vecRef.current.filter(v => v.id !== id); changed = true; }
        }
        if (changed) schedulePresent();
      }
      return;
    }

    const cur = creatingRef.current;
    if (cur) {
      if (!cur.points || cur.points.length < 2) { creatingRef.current=null; schedulePresent(); return; }
      vecRef.current = [...vecRef.current, { ...cur }];
      creatingRef.current=null; schedulePresent();
    }
  };

  // 우클릭 컨텍스트 → 라디얼
  useEffect(() => {
    const el = canvasRef.current; if (!el) return;
    const onCtx = (e) => { e.preventDefault(); openRadialAt(e.clientX ?? 0, e.clientY ?? 0); };
    el.addEventListener('contextmenu', onCtx);
    return () => el.removeEventListener('contextmenu', onCtx);
  }, [openRadialAt]);

  const onPointerEnter = (e) => updateCursor({ ...toCssXY(e || {}), visible:true, rCss: rFrom(tool, eraserSize, size) });
  const onPointerLeave  = () => {
    if (lpRef.current.timer) { clearTimeout(lpRef.current.timer); lpRef.current.timer = null; }
    setIsDrawing(false); creatingRef.current=null; erasingRef.current=null; updateCursor({ visible:false });
  };

  // ── 명령
  const clear = () => { pushHistory(); const doc=docRef.current, dctx=dctxRef.current; dctx.fillStyle='#fff'; dctx.fillRect(0,0,doc.width,doc.height); vecRef.current=[]; schedulePresent(); };

  // ── 내보내기
  const toDataURL = (type, quality) => {
    const doc = docRef.current, off = document.createElement('canvas'); off.width=doc.width; off.height=doc.height;
    const ctx = off.getContext('2d',{willReadFrequently:true}); ctx.drawImage(doc,0,0);
    const drawObjectDocExport = (oCtx,o) => { oCtx.save(); oCtx.lineWidth=Math.max(1,o.strokeWidth); oCtx.lineJoin='round'; oCtx.lineCap='round'; if (o.stroke && o.strokeWidth>0) oCtx.strokeStyle=o.stroke; if (o.type==='path' && o.points?.length>1){ oCtx.beginPath(); oCtx.moveTo(o.points[0].x, o.points[0].y); for (let i=1;i<o.points.length;i++){ const p=o.points[i]; oCtx.lineTo(p.x, p.y);} oCtx.stroke(); } oCtx.restore(); };
    for (const o of vecRef.current) {
      if (o.erasers?.length) { const res = maskedAlphaBBox(o); if (res.empty) continue; }
      if (!o.erasers?.length) { drawObjectDocExport(ctx, o); continue; }
      let bb = bboxOfPath(o.points||[], Math.max(2,(o.strokeWidth||2)/2 + 2));
      for (const er of o.erasers) bb = unionBBox(bb, bboxOfPath(er.points||[], Math.max(2,(er.size||8)/2 + 2)));
      bb.w=Math.max(1,Math.ceil(bb.w)); bb.h=Math.max(1,Math.ceil(bb.h));
      const tmp=document.createElement('canvas'); tmp.width=bb.w; tmp.height=bb.h; const tctx=tmp.getContext('2d',{willReadFrequently:true});
      tctx.save(); tctx.translate(-bb.x,-bb.y); drawObjectDocExport(tctx,o);
      for (const er of (o.erasers||[])){ if (!er.points?.length) continue; tctx.save(); tctx.globalCompositeOperation='destination-out'; tctx.lineCap='round'; tctx.lineJoin='round'; tctx.lineWidth=Math.max(1,er.size||8); tctx.beginPath(); const ps=er.points; tctx.moveTo(ps[0].x,ps[0].y); for (let i=1;i<ps.length;i++) tctx.lineTo(ps[i].x,ps[i].y); tctx.stroke(); tctx.restore(); }
      tctx.restore(); ctx.drawImage(tmp, bb.x, bb.y);
    }
    try { return type ? off.toDataURL(type,quality) : off.toDataURL(); } catch { return off.toDataURL(); }
  };

  // ── 외부 API
  const loadFromDataURL = useCallback((dataURL)=> new Promise((resolve)=>{
    pushHistory(); const img=new Image(); img.onload=()=>{ const w=img.naturalWidth||img.width, h=img.naturalHeight||img.height;
      const off=document.createElement('canvas'); off.width=w; off.height=h; const dctx=off.getContext('2d',{willReadFrequently:true});
      dctx.fillStyle='#fff'; dctx.fillRect(0,0,w,h); dctx.drawImage(img,0,0); docRef.current=off; dctxRef.current=dctx; vecRef.current=[]; recomputeView(); resolve(true); };
    img.src = dataURL;
  }), [recomputeView]);

  const setAspectRatio = useCallback((ratioStr)=>{
    if (!ratioStr || !/^\d+:\d+$/.test(ratioStr)) { recomputeView(); return true; }
    // 이제는 비율을 강제하지 않고, 다음 recomputeView에서 컨테이너 크기로 자동 스트레치됨
    recomputeView(); return true;
  }, [recomputeView]);

  // ── 반환
  return {
    containerRef, canvasRef,
    onPointerEnter, onPointerLeave, onPointerDown, onPointerMove, onPointerUp,
    undo, clear, historyCount, toDataURL, cursor, loadFromDataURL, setAspectRatio,
  };
}
