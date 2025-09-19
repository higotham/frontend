import React, { useEffect, useRef, useCallback } from 'react';

/**
 * ResultPanel (variant='layer')
 * - open: boolean
 * - onOpenChange(boolean)
 * - url: 결과 이미지 URL
 * - onClose(): 닫기 콜백
 * 접근성:
 *  - 열리면 캔버스/툴 영역 inert 처리
 *  - ESC로 닫기, 닫히면 포커스 안전 복원
 */
export default function ResultPanel({
  variant = 'layer',
  open,
  onOpenChange,
  url,
  onClose,
}) {
  const closeBtnRef = useRef(null);

  const getSafeFocusTarget = () =>
    document.querySelector('.canvas-page .tools-toggle') ||
    document.querySelector('.aiw-head .aiw-mini-btn') ||
    document.querySelector('.paint-canvas') ||
    document.body;

  const closeWithFocusRestore = useCallback(() => {
    try { getSafeFocusTarget()?.focus(); } catch {}
    onOpenChange?.(false);
    onClose?.();
  }, [onOpenChange, onClose]);

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeWithFocusRestore();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeWithFocusRestore]);

  // inert 적용/해제
  useEffect(() => {
    const offTargets = [
      document.querySelector('.canvas-page .stage'),
      document.querySelector('.canvas-page #tools'),
      document.querySelector('.canvas-page .prompt-dock'),
    ].filter(Boolean);

    if (open) {
      offTargets.forEach(el => { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); });
      setTimeout(() => { try { closeBtnRef.current?.focus(); } catch {} }, 0);
    } else {
      offTargets.forEach(el => { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); });
    }

    return () => {
      offTargets.forEach(el => { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); });
    };
  }, [open]);

  if (!open || variant !== 'layer') return null;

  return (
    <div className="result-layer" role="dialog" aria-modal="true" aria-label="결과 이미지 미리보기">
      <div className="scrim" onClick={closeWithFocusRestore} />
      <div className="sheet">
        {url ? (
          <img className="image" src={url} alt="생성 결과" />
        ) : (
          <p className="text-muted">결과 이미지가 아직 없습니다.</p>
        )}
        <div style={{ position:'absolute', top:14, right:14, display:'flex', gap:8 }}>
          <button ref={closeBtnRef} className="btn-orange" onClick={closeWithFocusRestore}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
