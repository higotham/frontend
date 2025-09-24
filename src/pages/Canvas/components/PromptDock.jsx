/* =======================================================================
 * [PATCH] src/components/Canvas/PromptDock.jsx
 *  - K-Sampler 호출 시 overlay 모드로 사용
 * ======================================================================= */
import { useEffect, useRef, useState } from 'react';
import KSamplerControl from '@/pages/Canvas/components/KSamplerControl.jsx';

export default function PromptDock({
  open, setOpen,
  prompt, setPrompt,
  canGenerate, onGenerate,
  isGenerating, /* error (미사용: 오버레이로 대체) */
  // 도구/모델/비율
  toolsOpen, onToggleTools,
  modelLabel = '모델 선택', onOpenModelPicker,
  aspectLabel = '1:1', onOpenAspectPicker,
  // 업로드 이미지
  initImage, onInitSelect, onInitClear,
  position = 'bottom',
  // 우상단 오버레이
  overlayProgress, overlayToast,
  // ▼ (선택) 샘플러 제어용
  samplerSettings, onSamplerChange,
}) {
  const innerRef = useRef(null);
  const fileRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const promptRef = useRef(null);
  const [dockH, setDockH] = useState(120);

  const dockClass = `dock ${open ? 'is-open' : 'is-closed'}`;
  const getSafeFocusTarget = () =>
    document.querySelector('.canvas-page .tools .aiw-head .aiw-mini-btn') ||
    document.querySelector('.canvas-page .tools') ||
    document.querySelector('.paint-canvas') ||
    document.body;

  useEffect(() => {
    if (!toolsOpen) return;
    if (document.activeElement === toggleBtnRef.current) {
      try { getSafeFocusTarget()?.focus(); } catch {}
    }
  }, [toolsOpen]);

  useEffect(() => {
    if (open) setTimeout(() => { try { promptRef.current?.focus(); } catch {} }, 0);
  }, [open]);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const update = () => setDockH(el.offsetHeight || 120);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const openPicker = () => fileRef.current?.click();
  const onDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length) onInitSelect?.(files);
  };
  const clearImage = () => { fileRef.current.value = null; onInitClear?.(); };
  const clamp = (n) => Math.max(0, Math.min(100, Math.round(n || 0)));

  return (
    <>
      <div id="dock" className={dockClass} role="region" aria-label="프롬프트 도크">
        <div ref={innerRef} className="dock-inner">
          <div className="dock-assets">
            <div
              className={`init-tile ${initImage ? 'has-image' : ''}`}
              role="button" tabIndex={0}
              onClick={openPicker}
              onKeyDown={(e)=> (e.key === 'Enter' || e.key === ' ') && openPicker()}
              onDragOver={(e)=> e.preventDefault()}
              onDrop={onDrop}
              aria-label="이미지 추가"
              title="이미지 추가 (클릭 또는 드래그 앤 드롭)"
            >
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e)=> onInitSelect?.(e.target.files)} />
              {initImage ? (
                <img className="init-thumb" src={initImage} alt="업로드 이미지 미리보기" style={{position: 'static'}} />
              ) : (
                <div className="init-empty">
                  <div className="plus">＋</div>
                  <div className="label">이미지 추가</div>
                </div>
              )}
            </div>
            {initImage && (
              <button
                type="button" onClick={clearImage} aria-label="업로드 이미지 제거" title="제거" className="init-remove"
                style={{zIndex: '100', position: 'absolute', top: '15px', left: '95px', border: 'none', borderRadius: '50%', opacity: '0.7'}}
              >✕</button>
            )}
          </div>

          {/* ===== 프롬프트 / 액션 ===== */}
          <textarea
            ref={promptRef}
            className="prompt"
            placeholder="프롬프트를 입력하세요…"
            value={prompt}
            onChange={(e)=>setPrompt(e.target.value)}
            rows={2}
          />

          <div className="dock-actions">
            <button type="button" className="dock-btn dock-btn--ghost" onClick={() => onOpenModelPicker?.()} title="모델 선택">
              모델: <strong>{modelLabel}</strong>
            </button>

            <button type="button" className="dock-btn dock-btn--ghost" onClick={() => onOpenAspectPicker?.()} title="이미지 비율">
              비율: <strong>{aspectLabel}</strong>
            </button>

            {/* ▼ overlay 모드로 K-Sampler 열기 */}
            <KSamplerControl
              mode="overlay"                  /* ← 핵심: 오버레이 */
              sampler={samplerSettings}
              onSamplerChange={onSamplerChange}
              buttonLabel="K-Sampler"
              buttonClassName="dock-btn dock-btn--ghost"
            />

            <button
              type="button"
              className="dock-btn dock-btn--primary"
              disabled={!canGenerate || isGenerating}
              onClick={onGenerate}
            >
              {isGenerating ? '생성 중…' : '이미지 생성'}
            </button>
          </div>
        </div>
      </div>

      {/* 도크 열/닫기 토글 */}
      <button
        ref={toggleBtnRef}
        type="button"
        className={`dock-toggle ${open ? 'is-open' : 'is-closed'} ${toolsOpen ? 'is-blocked' : ''}`}
        aria-expanded={open}
        aria-controls="dock"
        onClick={() => setOpen(v => !v)}
        aria-label={open ? '도크 닫기' : '도크 열기'}
        disabled={!!toolsOpen}
        aria-hidden={!!toolsOpen}
        tabIndex={toolsOpen ? -1 : 0}
        style={{ bottom: open ? (dockH + 8) : 8 }}
      >
        {open ? 'v' : '^'}
      </button>
    </>
  );
}