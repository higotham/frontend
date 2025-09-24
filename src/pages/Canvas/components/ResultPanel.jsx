import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function ResultPanel({
  open,
  onOpenChange,
  url,
  onClose,
  variant = 'layer', // API 호환만 유지, 로직엔 영향 없음
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
      if (e.key === 'Escape') {
        e.preventDefault();
        closeWithFocusRestore();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeWithFocusRestore]);

  // 레이어 오픈 시 inert 처리 + 포커스 이동
  useEffect(() => {
    if (!open) return;
    // 닫기 버튼 포커스
    setTimeout(() => { try { closeBtnRef.current?.focus(); } catch {} }, 0);

    const targets = [
      document.querySelector('.canvas-page .stage'),
      document.querySelector('.canvas-page .tools'),
      document.querySelector('.canvas-page .prompt-dock'),
    ];
    targets.forEach(el => {
      if (!el) return;
      el.setAttribute('inert', '');
      el.setAttribute('aria-hidden', 'true');
    });
    return () => {
      targets.forEach(el => {
        if (!el) return;
        el.removeAttribute('inert');
        el.removeAttribute('aria-hidden');
      });
    };
  }, [open]);

  if (!open) return null;

  const ui = (
    <>
      <div
        className="aiw-result-scrim is-on"
        onClick={closeWithFocusRestore}
        aria-hidden="true"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="결과 레이어"
        className="aiw-result-layer is-open"
      >
        <div className="aiw-result-viewport" aria-live="polite">
          {url ? (
            <img
              className="aiw-result-image"
              src={url}
              alt="결과 이미지"
              draggable="false"
            />
          ) : (
            <div style={{opacity: .75, fontWeight: 800}}>결과 이미지가 없습니다</div>
          )}
        </div>
      </section>
    </>
  );

  // 조상 transform/overflow 간섭 방지
  return createPortal(ui, document.body);
}
