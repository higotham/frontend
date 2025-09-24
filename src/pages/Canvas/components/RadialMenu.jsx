import { useEffect, useRef, useState } from 'react';

/* ────────────────────────────────────────── utils */
function toXY(angleDeg, radius){
  const rad = (angleDeg*Math.PI)/180;
  return { dx: Math.round(Math.cos(rad)*radius), dy: Math.round(Math.sin(rad)*radius) };
}

// hex helpers
const normalizeHex = (hex) => {
  if (!hex) return '#111111';
  let s = (''+hex).trim();
  if (s[0] !== '#') s = '#'+s;
  // expand #abc → #AABBCC
  const short = /^#([0-9a-f]{3})$/i.exec(s);
  if (short) {
    const a = short[1];
    s = '#'+a[0]+a[0]+a[1]+a[1]+a[2]+a[2];
  }
  const full = /^#([0-9a-f]{6})$/i.exec(s);
  return full ? ('#'+full[1].toUpperCase()) : '#111111';
};

const fmt = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/* 프로젝트 팔레트(예시) */
const DEFAULT_SWATCHES = ['#FF6A00','#F59E0B','#10B981','#2DD4BF','#3B82F6','#6366F1','#9333EA','#EF4444','#111111','#FFFFFF'];

/* ────────────────────────────────────────── component */
export default function RadialMenu({
  open, x, y,
  tool, color,
  brushSize, eraserSize,
  onClose,
  onPickBrush, onPickEraser,
  onPickColor,
  onChangeBrushSize, onChangeEraserSize,
  onSaveDraft, onSaveDB,

  /** ▼▼▼ progotham2 ToolsSidebar “로드(DB)” 이식용 프롭 (그대로 사용) ▼▼▼ */
  // progotham2의 useCanvasPage에서 내려오는 값/핸들러와 1:1 매칭
  dbOpen = false,
  dbItems = [],
  onToggleDB,         // () => void  : FastAPI("POST","/canvas",{}) 호출 + 목록 set
  onLoadDB,           // (item) => … : 클릭한 항목 로드 (decode → loadFromDataURL 등)

  /** (구 버전 호환) 기존에 쓰던 onOpenLoad가 있으면 그대로 fallback */
  onOpenLoad
}){
  const rootRef = useRef(null);

  const SHOW_LABELS = false;

  // 컬러 픽커 (네이티브 input[type=color] + HEX 입력 + 스와치)
  const [colorOpen, setColorOpen] = useState(false);
  const [hex, setHex] = useState(normalizeHex(color || '#111111'));

  // 메뉴가 열릴 때마다 현재 색 반영
  useEffect(()=>{ if (open) setHex(normalizeHex(color || '#111111')); }, [open, color]);

  // ESC / 바깥 클릭 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e)=>{ if(e.key==='Escape') onClose?.(); };
    const onDown = (e)=>{ if(rootRef.current && !rootRef.current.contains(e.target)) onClose?.(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return ()=>{
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const R_MAIN = 96;
  const isBrush = tool !== 'eraser';
  const sizeValue = isBrush ? (brushSize ?? 8) : (eraserSize ?? 16);

  // 👉 “로드(DB)” 버튼은 progotham2와 동일하게 onToggleDB 실행
  const handleOpenLoad = () => {
    if (typeof onToggleDB === 'function') onToggleDB();
    else if (typeof onOpenLoad === 'function') onOpenLoad(); // 구버전 호환
  };

  const mainItems = [
    { key: 'brush',  label: 'Brush', icon: '✏️',  onClick: onPickBrush,  angle: -90,  pressed: isBrush },
    { key: 'eraser', label: 'Eraser',icon: '🧽',  onClick: onPickEraser, angle: -30,  pressed: !isBrush },
    { key: 'color',  label: 'Color', icon: '🎨',  onClick: ()=> setColorOpen(v=>!v), angle:  30,  pressed: colorOpen },
    { key: 'draft',  label: 'Save',  icon: '💾',  onClick: onSaveDraft,  angle:  90 },
    { key: 'save',   label: 'DB',    icon: '📦',  onClick: onSaveDB,     angle: 140 },
    { key: 'load',   label: 'Load',  icon: '📂',  onClick: handleOpenLoad, angle: -140, pressed: !!dbOpen },
  ];

  const applyHex = (h) => {
    const v = normalizeHex(h);
    setHex(v);
    onPickColor?.(v);
  };

  return (
    <>
      <div className="aiw-radial-backdrop" onClick={onClose} aria-hidden />
      <div
        ref={rootRef}
        className={`aiw-radial-root ${colorOpen ? 'is-color-open' : ''} ${dbOpen ? 'is-db-open' : ''}`}
        style={{ '--rm-x': `${x}px`, '--rm-y': `${y}px` }}
        onPointerDown={(e)=>e.stopPropagation()}
      >
        <div className="aiw-radial-origin" aria-hidden />

        {/* 메인 부채꼴 버튼들 */}
        {mainItems.map((it)=>{
          const { dx, dy } = toXY(it.angle, R_MAIN);
          return (
            <button
              key={it.key}
              type="button"
              className={`aiw-radial-item btn btn-mini ${it.pressed ? 'is-active' : ''}`}
              style={{ '--dx': `${dx}px`, '--dy': `${dy}px` }}
              onClick={it.onClick}
              aria-label={it.label}
              title={it.label}
            >
              <span className="aiw-radial-ico" aria-hidden>{it.icon}</span>
              {SHOW_LABELS ? <span className="aiw-radial-label">{it.label}</span> : null}
            </button>
          );
        })}

        {/* 🎨 컬러 패널: 네이티브 컬러 픽커 + HEX 입력 + 스와치 */}
        <section className="aiw-color-panel" aria-label="Color panel">
          <div className="aiw-color-sample" style={{ background: hex }} aria-hidden />
          <div className="aiw-color-rows">
            <div className="aiw-color-row">
              <label htmlFor="aiwColorHex">HEX</label>
              <input
                id="aiwColorHex"
                className="aiw-color-hex"
                type="text"
                inputMode="text"
                spellCheck="false"
                value={hex}
                onChange={(e)=> setHex(e.target.value)}
                onBlur={(e)=> applyHex(e.target.value)}
                onKeyDown={(e)=> { if (e.key === 'Enter') applyHex(e.currentTarget.value); }}
                placeholder="#000000"
                aria-label="Hex color"
              />
              <input
                className="aiw-color-input"
                type="color"
                value={hex}
                onChange={(e)=> applyHex(e.target.value)}
                aria-label="Color picker"
                title="색상 선택"
              />
            </div>

            <div className="aiw-swatches" role="list" aria-label="Color swatches">
              {DEFAULT_SWATCHES.map((sw) => (
                <button
                  key={sw}
                  type="button"
                  role="listitem"
                  className="aiw-swatch btn btn-mini"
                  style={{ '--swatch': sw, background: sw }}
                  onClick={()=> applyHex(sw)}
                  aria-label={`Pick ${sw}`}
                  title={sw}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 🗄️ progotham2 “로드(DB)” 패널 이식
             - onToggleDB 호출로 목록을 가져오고 (FastAPI POST /canvas)
             - dbItems를 그대로 렌더링, 클릭 시 onLoadDB(item) 호출 (progotham2와 동일) */}
        {dbOpen && (
          <section className="aiw-db-panel" aria-label="DB saved list">
            <header className="aiw-db-head">
              <strong>저장목록</strong>
              <div className="spacer" />
              <button type="button" className="btn btn-mini" onClick={onToggleDB}>닫기</button>
            </header>
            <div className="aiw-db-list" role="list">
              {(!dbItems || dbItems.length === 0) && (
                <div className="aiw-db-empty">저장된 항목이 없습니다.</div>
              )}
              {dbItems?.map(item => (
                <button
                  key={item.no ?? item.id ?? item.name}
                  type="button"
                  className="aiw-db-item"
                  role="listitem"
                  title={fmt(item.regDate || item.updatedAt || item.createdAt)}
                  onClick={()=> onLoadDB?.(item)}
                >
                  <span className="name">{item.name || '(무제)'}</span>
                  <span className="meta">{fmt(item.regDate || item.updatedAt || item.createdAt)}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 굵기 패널 */}
        <section className="aiw-radial-panel" aria-label="Stroke size">
          <div className="aiw-radial-panel__row">
            <strong>{isBrush ? 'Brush' : 'Eraser'}</strong>
            <span>{sizeValue}px</span>
          </div>
          <input
            className="aiw-radial-range"
            type="range"
            min={1}
            max={isBrush ? 64 : 96}
            step={1}
            value={sizeValue}
            onChange={(e)=> (
              isBrush
                ? onChangeBrushSize?.(Number(e.target.value))
                : onChangeEraserSize?.(Number(e.target.value))
            )}
            aria-label={isBrush ? 'Brush size' : 'Eraser size'}
          />
        </section>
      </div>
    </>
  );
}
