// src/components/Canvas/DBModal.jsx
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function fmt(ts){
  if(!ts) return '';
  const d=new Date(ts), p=(n)=>String(n).padStart(2,'0');
  return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function toXY(angleDeg, radius){
  const rad = (angleDeg*Math.PI)/180;
  return { dx: Math.round(Math.cos(rad)*radius), dy: Math.round(Math.sin(rad)*radius) };
}

/**
 * props:
 * - open, items, onLoad(item), onClose, onRefresh
 * - placement: 'anchor' | 'center' (default 'anchor')
 * - anchor: { x, y, angleDeg=-140, r=96 }  // 라디얼 기준점과 로드버튼 벡터
 */
export default function DBModal({
  open, items = [],
  onLoad, onClose, onRefresh,
  placement = 'anchor',
  anchor = null
}){
  const cardRef = useRef(null);
  const [pos, setPos] = useState({ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' });

  // ESC 닫기 + 스크롤 락
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // 위치 계산(앵커 모드)
  useLayoutEffect(() => {
    if (!open) return;
    if (placement !== 'anchor' || !anchor) {
      setPos({ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' });
      return;
    }
    const { x, y, angleDeg = -140, r = 96 } = anchor;
    const { dx, dy } = toXY(angleDeg, r);
    // 버튼 실제 위치
    const bx = x + dx;
    const by = y + dy;

    // 카드 크기 측정 후 "왼쪽-상단에서 펼침"
    const el = cardRef.current;
    const W = el?.offsetWidth ?? 420;
    const H = el?.offsetHeight ?? 360;

    // 기본 배치: 버튼의 왼쪽 상단에 붙여서 나타나게 (10시 방향 기준)
    let left = bx - W - 12;
    let top  = by - 24;

    // 화면 밖으로 나가지 않도록 클램프
    const vw = window.innerWidth, vh = window.innerHeight;
    left = Math.max(12, Math.min(left, vw - W - 12));
    top  = Math.max(12, Math.min(top,  vh - H - 12));

    setPos({ top: `${top}px`, left: `${left}px`, transform: 'none' });
  }, [open, placement, anchor]);

  if (!open) return null;

  const ui = (
    <>
      {/* 백드롭 */}
      <div
        style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.45)',
          backdropFilter:'blur(1.5px)', zIndex:1300
        }}
        onClick={onClose}
      />

      {/* 카드 */}
      <div
        role="dialog" aria-modal="true" aria-label="저장목록"
        style={{
          position:'fixed', zIndex:1301, pointerEvents:'none', inset:0
        }}
      >
        <div
          ref={cardRef}
          role="document"
          style={{
            position:'absolute', ...pos, pointerEvents:'auto',
            width:'min(92vw, 560px)', maxHeight:'min(80vh, 720px)',
            background:'var(--bg, #fff)', color:'var(--ink, #1b1f23)',
            border:'1px solid rgba(0,0,0,.08)', borderRadius:16,
            boxShadow:'0 6px 28px rgba(0,0,0,.18), 0 2px 10px rgba(0,0,0,.06)',
            display:'flex', flexDirection:'column', overflow:'hidden'
          }}
        >
          <header
            style={{
              position:'sticky', top:0, display:'flex', alignItems:'center',
              justifyContent:'space-between', gap:12, padding:'12px 14px',
              borderBottom:'1px solid rgba(0,0,0,.08)', background:'var(--bg, #fff)', zIndex:1
            }}
          >
            <strong style={{fontSize:16}}>저장목록</strong>
            <div style={{display:'flex', gap:8}}>
              <button type="button" className="btn btn-sm" onClick={onRefresh}>새로고침</button>
              <button type="button" className="btn btn-sm" onClick={onClose}>닫기</button>
            </div>
          </header>

          <div style={{padding:8, overflow:'auto'}}>
            {(!items || items.length === 0) && (
              <div style={{padding:24, textAlign:'center', color:'rgba(0,0,0,.55)'}}>항목이 없습니다.</div>
            )}

            {items?.map((it) => {
              const id = it.id ?? it.no ?? it._id;
              return (
                <div
                  key={id}
                  style={{
                    display:'grid', gridTemplateColumns:'1fr auto auto',
                    alignItems:'center', gap:'8px 12px',
                    padding:'10px 12px', borderRadius:10,
                    border:'1px solid transparent'
                  }}
                  onMouseEnter={(e)=>{ e.currentTarget.style.background='rgba(255,106,0,.08)'; e.currentTarget.style.borderColor='rgba(0,0,0,.08)'; }}
                  onMouseLeave={(e)=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent'; }}
                >
                  <div style={{fontWeight:600, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis'}} title={it.name || '(무제)'}>{it.name || '(무제)'}</div>
                  <div style={{fontSize:12, opacity:.8, color:'rgba(0,0,0,.55)'}}>{fmt(it.updatedAt || it.createdAt || it.regDate)}</div>
                  <button type="button" className="btn btn-sm" onClick={() => onLoad?.(it)}>로드</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(ui, document.body);
}
