// src/pages/Canvas/hooks/useCanvasPage.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRoot } from '@/services/core/RootProvider.jsx';
import useCanvasDrawing from '@/pages/Canvas/hooks/useCanvasDrawing.js';
import useDrafts from '@/pages/Canvas/hooks/useDrafts.js';
import useGeneration from '@/pages/Canvas/hooks/useGeneration.js';
import { FastAPI } from '@/services/network/Network.js';
import { decode } from '@/services/core/Commons.js';
import { MODEL_OPTIONS, getModelLabel } from '@/config/models.js';
import { ASPECT_OPTIONS, getAspectLabel } from '@/config/aspects.js';

export default function useCanvasPage() {
  const { access, getUserNo } = useRoot();
  const [search] = useSearchParams();
  const draftParam = search.get('draft') || null;

  // UI
  const [dockOpen, setDockOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [aspectOpen, setAspectOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);

  // 🔶 라디알/DB 모달
  const [radialOpen, setRadialOpen] = useState(false);
  const [radialXY, setRadialXY] = useState({ x: 0, y: 0 });
  const [dbModalOpen, setDbModalOpen] = useState(false);

  // Tools / Styles
  const [tool, _setTool] = useState('brush');
  const setTool = useCallback((t) => { if (t !== 'brush' && t !== 'eraser') t = 'brush'; _setTool(t); }, []);
  const [size, setSize] = useState(8);
  const [eraserSize, setEraserSize] = useState(16);
  const [color, setColor] = useState('#111111');
  const stroke = color;                 // alias 값만 사용 (setStroke 제거)
  const [fill, setFill] = useState('none');
  const [strokeWidth, setStrokeWidth] = useState(3);

  // Model / Aspect
  const [model, setModel] = useState(0);
  const [aspect, setAspect] = useState(0);

  // Prompt / Result
  const [prompt, setPrompt] = useState('');
  const [resultUrl, setResultUrl] = useState('');

  // Overlays
  const [overlayProgress, setOverlayProgress] = useState(null);
  const [toast, setToast] = useState(null);
  const progTimerRef = useRef(null);

  // Init image (img2img)
  const [initImage, setInitImage] = useState(null);

  const [samplerSettings, setSamplerSettings] = useState({seed: 0, controlAfterGenerate: 'randomize', step: 20, cfg: 7, samplerName: 'dpmpp_2m', scheduler: 'normal', denoise: 0.5});

  // 👇 라디알 열기 콜백
  const onRadialOpen = useCallback((x, y) => {
    setRadialXY({ x, y });
    setRadialOpen(true);
  }, []);

  // ✅ 캔버스 훅
  const {
    containerRef, canvasRef,
    onPointerEnter, onPointerLeave, onPointerDown, onPointerMove, onPointerUp,
    undo, historyCount, toDataURL, cursor,
    loadFromDataURL
  } = useCanvasDrawing({
    tool, color, size, eraserSize, stroke, fill, strokeWidth,
    enabled: access,
    autoApplySelectedStyle: false,
    onRadialOpen,
  });

  // 🔧 이미지 저장용 데이터 URL
  const getSaveDataURL = useCallback(() => {
    if (initImage) return initImage;
    try { const webp = toDataURL('image/webp', 0.85); if (webp?.startsWith('data:image/webp')) return webp; } catch {}
    try { const jpg  = toDataURL('image/jpeg', 0.9);  if (jpg?.startsWith('data:image/jpeg')) return jpg; } catch {}
    return toDataURL();
  }, [initImage, toDataURL]);

  // Drafts
  const { draftId, saveNow, markDirty } = useDrafts({
    access, draftParam, getSaveDataURL, loadFromDataURL,
    metaDeps: { tool, size, eraserSize, aspect, hasInitImage: !!initImage, stroke: color, fill, strokeWidth, brushColor: color },
    onLoaded: (doc) => {
      setPrompt(doc.prompt || ''); setModel(doc.model || 0);
      if (doc.meta?.aspect) setAspect(doc.meta.aspect);
      if (doc.initImageDataURL) setInitImage(doc.initImageDataURL);
      const m = doc.meta || {};
      if (m.brushColor) setColor(m.brushColor); else if (m.stroke) setColor(m.stroke);
      if (m.fill) setFill(m.fill);
      if (m.strokeWidth) setStrokeWidth(m.strokeWidth);
      if (m.eraserSize) setEraserSize(m.eraserSize);
    },
    getAdditionalDraftFields: () => ({ prompt, model, initImageDataURL: initImage || null }),
  });

  // Generate (통신부: 변경 금지)
  const { isGenerating, error, setError, resultUrl: genUrl, generate } = useGeneration({ getSaveDataURL });
  useEffect(() => { if (genUrl) setResultUrl(genUrl); }, [genUrl]);

  // useEffect(() => {
  //   if (!resultUrl) return;
  //   setToast({ type: 'ok', msg: '이미지 생성 완료!' });
  //   const t = setTimeout(() => setToast(null), 2000);
  //   return () => clearTimeout(t);
  // }, [resultUrl]);

  // useEffect(() => {
  //   if (!error) return;
  //   setToast({ type: 'err', msg: error });
  //   const t = setTimeout(() => setToast(null), 2500);
  //   return () => clearTimeout(t);
  // }, [error]);

  useEffect(() => () => { if (progTimerRef.current) clearInterval(progTimerRef.current); }, []);

  const canGenerate = useMemo(() => prompt.trim().length > 0 && !isGenerating, [prompt, isGenerating]);

  const handleGenerate = useCallback(async () => {
    setResultUrl(''); setResultOpen(false); setToast(null);
    let p = 1;
    setOverlayProgress({ value: p, label: '이미지 생성 중…' });
    if (progTimerRef.current) clearInterval(progTimerRef.current);
    progTimerRef.current = setInterval(() => {
      p = Math.min(95, p + 2 + Math.random() * 6);
      setOverlayProgress(prev => (prev ? { ...prev, value: Math.round(p) } : null));
    }, 120);

    await generate({ prompt, model, aspect, getUserNo, ksampler: samplerSettings });

    if (progTimerRef.current) { clearInterval(progTimerRef.current); progTimerRef.current = null; }
    let end = p;
    const fin = setInterval(() => {
      end = Math.min(100, end + 5 + Math.random() * 10);
      setOverlayProgress(prev => (prev ? { ...prev, value: Math.round(end) } : null));
      if (end >= 100) { clearInterval(fin); setTimeout(() => { setOverlayProgress(null); setResultOpen(true); }, 120); }
    }, 40);
  }, [generate, prompt, model, aspect, getUserNo]);

  // =========================
  // DB 연동 (progotham2 규약)
  // =========================
  const [dbItems, setDbItems] = useState([]);
  const refreshDB = useCallback(async () => {
    try {
      const res = await FastAPI('POST', '/canvas', {});
      const list = Array.isArray(res?.result) ? res.result
                : Array.isArray(res?.rows)   ? res.rows
                : (Array.isArray(res) ? res : []);
      const mapped = list.map(it => ({
        id: it.id ?? it.no ?? it._id ?? it.ID ?? it.No,
        name: it.name ?? '(무제)',
        draft: it.draft ?? it.imageDataURL ?? '',
        regDate: it.regDate ?? it.modDate ?? it.createdAt ?? it.updatedAt ?? null,
        meta: it.meta ?? null,
      }));
      setDbItems(mapped);
    } catch (e) {
      console.error(e);
      setToast?.({ type: 'err', msg: '목록을 불러오지 못했습니다.' });
    }
  }, []);

  const defaultDBName = useCallback(() => {
    const base = (prompt || 'Canvas').trim().slice(0, 20) || 'Canvas';
    const d = new Date(), p = (n) => String(n).padStart(2, '0');
    return `${base}-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
  }, [prompt]);

  const handleSaveDraft = useCallback(async () => {
    try { await saveNow(); setError(''); setToast({ type: 'ok', msg: '브라우저에 임시 저장 완료' }); }
    catch { setError('임시 저장 중 오류가 발생했습니다.'); setToast({ type: 'err', msg: '임시 저장 실패' }); }
  }, [saveNow, setError]);

  // ✅ DB 저장 (FastAPI PUT /canvas)
  const handleSaveDB = useCallback(async () => {
    const name = (window.prompt?.('저장할 이름(프로젝트/파일명)', defaultDBName()) || '').trim();
    if (!name) { return; }

    // userNo, name, draft << 데이터베이스에 저장
    const draft = await saveNow();
    
    FastAPI("PUT", "/canvas", {name, draft})
    .then(res => {
      if(res.status) {
        setToast({ type: 'ok', msg: 'DB(모의) 저장 완료' });
      } else {
        setToast({ type: 'err', msg: 'DB(모의) 저장 실패' });
      }
    });

    // try {
    //   const dataUrl = getSaveDataURL(); if (!dataUrl) throw new Error('no image');
    //   const name = (window.prompt?.('저장할 이름(프로젝트/파일명)', defaultDBName()) || '').trim();
    //   if (!name) return;
    //   const res = await FastAPI('PUT', '/canvas', {
    //     name,
    //     draft: dataUrl,
    //     meta: { tool, size, eraserSize, aspect, prompt, model, draftId, stroke: color, fill, strokeWidth, brushColor: color }
    //   });
    //   if (res?.status) {
    //     await refreshDB();
    //     setToast({ type: 'ok', msg: 'DB 저장 완료' });
    //   } else {
    //     setToast({ type: 'err', msg: '서버 저장 실패' });
    //   }
    // } catch (e) {
    //   console.error(e);
    //   setToast({ type: 'err', msg: '서버 저장 실패' });
    // }
  }, [saveNow, getSaveDataURL, defaultDBName, tool, size, eraserSize, aspect, prompt, model, draftId, color, fill, strokeWidth, refreshDB]);

  // ✅ DB 로드 (DBModal에서 item 객체를 넘김)
  const handleLoadFromDB = useCallback(async (item) => {
    try {
      if (item.draft) {
        const onDraft = decode(item.draft);  
        if (onDraft.imageDataURL) loadFromDataURL(onDraft.imageDataURL);
        const m = onDraft.meta || {};
        // if (m.stroke) setStroke(m.stroke);
        // if (m.fill) setFill(m.fill);
        if (m.strokeWidth) setStrokeWidth(m.strokeWidth);
        if (m.brushColor) setColor(m.brushColor);
        setToast({ type: 'ok', msg: `"${item.name}" 불러오기 완료` });
        setDbModalOpen(false);
      } else {
        setToast({ type: 'err', msg: '항목을 찾을 수 없습니다.' });
      }
      // const rec = item || null;
      // if (!rec) { setToast({ type: 'err', msg: '항목을 찾을 수 없습니다.' }); return; }
      // let dataUrl = rec.imageDataURL || rec.draft || '';
      // if (!dataUrl && typeof rec.draft === 'string' && rec.draft.trim().startsWith('{')) {
      //   try { const parsed = JSON.parse(rec.draft); if (parsed?.imageDataURL) dataUrl = parsed.imageDataURL; } catch {}
      // }
      // if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
      //   await loadFromDataURL(dataUrl);
      // } else {
      //   setToast({ type: 'err', msg: '저장된 이미지가 없습니다.' });
      //   return;
      // }
      // const m = rec.meta || {};
      // if (typeof m.prompt === 'string') setPrompt(m.prompt);
      // if (m.model != null) setModel(m.model);
      // if (m.aspect) setAspect(m.aspect);
      // if (m.brushColor) setColor(m.brushColor); else if (m.stroke) setColor(m.stroke);
      // if (m.fill) setFill(m.fill);
      // if (m.strokeWidth) setStrokeWidth(m.strokeWidth);
      // if (m.eraserSize) setEraserSize(m.eraserSize);
      // setToast({ type: 'ok', msg: `"${rec.name || '(무제)'}" 불러오기 완료` });
      // setDbModalOpen(false);
    } catch (e) {
      console.error(e);
      setToast({ type: 'err', msg: '로드 중 오류가 발생했습니다.' });
    }
  }, [loadFromDataURL]);

  const handleUndo = useCallback(() => { undo(); markDirty(); }, [undo, markDirty]);

  // 키보드: 저장/되돌리기
  useEffect(() => {
    if (!access) return;
    const isEditable = (el) => {
      if (!el) return false;
      const tag = (el.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea' || el.isContentEditable || (el.getAttribute?.('role') === 'textbox');
    };
    const onKey = (e) => {
      if (modelOpen || aspectOpen || isEditable(e.target)) return;
      const low = String(e.key || '').toLowerCase();
      const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && low === 's') { e.preventDefault(); handleSaveDB(); return; }
      if (mod && !e.shiftKey && (low === 'z')) { e.preventDefault(); if (historyCount > 0) handleUndo(); return; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [access, modelOpen, aspectOpen, historyCount, handleUndo, handleSaveDB]);

  const pageClass = `canvas-page ${resultOpen ? 'is-sheet-open' : ''}`;
  const brushSizeVal = useMemo(() => (tool === 'eraser' ? eraserSize : size), [tool, eraserSize, size]);

  const readFilesToDataURL = useCallback((files) => new Promise((resolve, reject) => {
    const f = files?.[0];
    if (!f || !/^image\//.test(f.type)) return reject(new Error('이미지가 아닙니다.'));
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(f);
  }), []);

  const handleInitSelect = useCallback(async (files) => {
    try { 
      const dataUrl = await readFilesToDataURL(files); 
      setInitImage(dataUrl); 
    } catch {}
  }, [readFilesToDataURL]);

  const handleInitClear = useCallback(() => { setInitImage(null); }, []);

  // Stage props (onContextMenu 제거: 훅 내부에서 자체 처리)
  const stageProps = useMemo(() => ({
    containerRef, canvasRef,
    onPointerEnter, onPointerLeave, onPointerDown, onPointerMove, onPointerUp,
    cursor, brushSize: brushSizeVal, tool
  }), [containerRef, canvasRef, onPointerEnter, onPointerLeave, onPointerDown, onPointerMove, onPointerUp, cursor, brushSizeVal, tool]);

  const promptProps = useMemo(() => ({
    open: dockOpen, setOpen: setDockOpen, prompt, setPrompt, canGenerate, onGenerate: handleGenerate, isGenerating,
    modelLabel: getModelLabel(model), onOpenModelPicker: () => setModelOpen(true),
    aspectLabel: getAspectLabel(aspect), onOpenAspectPicker: () => setAspectOpen(true),
    initImage, onInitSelect: handleInitSelect, onInitClear: handleInitClear,
    overlayProgress, overlayToast: toast, samplerSettings,  onSamplerChange: setSamplerSettings
  }), [dockOpen, prompt, canGenerate, handleGenerate, isGenerating, model, aspect, initImage, overlayProgress, toast]);

  const modelModalProps = useMemo(() => ({
    show: modelOpen, onHide: () => setModelOpen(false),
    value: model, onSelect: (v) => { setModel(v); setModelOpen(false); },
    options: MODEL_OPTIONS
  }), [modelOpen, model]);

  const aspectModalProps = useMemo(() => ({
    show: aspectOpen, onHide: () => setAspectOpen(false),
    value: aspect, onSelect: (v) => { setAspect(v); setAspectOpen(false); },
    options: ASPECT_OPTIONS
  }), [aspectOpen, aspect]);

  const resultProps = useMemo(() => ({
    key: resultUrl, url: resultUrl,
    open: resultOpen, onOpenChange: setResultOpen,
    onClose: () => setResultUrl('')
  }), [resultUrl, resultOpen]);

  // 라디알 프롭 (굵기/색상 제어 포함)
  const radialProps = useMemo(() => ({
    open: radialOpen,
    x: radialXY.x,
    y: radialXY.y,
    tool,
    color,
    brushSize: size,
    eraserSize,
    onClose: () => setRadialOpen(false),
    onPickBrush: () => { setTool('brush'); setRadialOpen(false); },
    onPickEraser: () => { setTool('eraser'); setRadialOpen(false); },
    onPickColor: (c) => { setColor(c); /* 메뉴 유지 (미리보기) */ },
    onChangeBrushSize: (v) => setSize(Number(v) || 1),
    onChangeEraserSize: (v) => setEraserSize(Number(v) || 1),
    onSaveDraft: async () => { await handleSaveDraft(); setRadialOpen(false); },
    onSaveDB: async () => { await handleSaveDB(); setRadialOpen(false); },
    onOpenLoad: () => { refreshDB(); setDbModalOpen(true); setRadialOpen(false); },
  }), [
    radialOpen, radialXY, tool, color, size, eraserSize,
    setTool, setColor, setSize, setEraserSize,
    handleSaveDraft, handleSaveDB, refreshDB
  ]);

  // DB 모달 프롭
  const dbModalProps = useMemo(() => ({
    open: dbModalOpen,
    items: dbItems,
    onClose: () => setDbModalOpen(false),
    onRefresh: refreshDB,
    onLoad: handleLoadFromDB,
  }), [dbModalOpen, dbItems, refreshDB, handleLoadFromDB]);

  return {
    access, pageClass,
    stageProps, isGenerating,
    promptProps, modelModalProps, aspectModalProps,
    resultProps,
    radialProps, dbModalProps,
  };
}
