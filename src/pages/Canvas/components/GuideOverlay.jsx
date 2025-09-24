/* src/pages/Canvas/components/GuideOverlay.jsx */

export default function GuideOverlay({
  visible = true,
  spacing = 12,
  dot = 1,
  opacity = 0.35,
  showCenter = true,
  blend = 'normal', // 필요 시에만 'multiply'로 전달
}) {
  if (!visible) return null;
  return (
    <div
      className="aiw-guide-overlay"
      aria-hidden="true"
      role="presentation"
      style={{
        '--guide-spacing': `${spacing}px`,
        '--guide-dot': `${dot}px`,
        '--guide-opacity': opacity,
        pointerEvents: 'none',     // 인라인 보강
        mixBlendMode: blend,       // 기본 normal
      }}
    >
      {showCenter && <div className="aiw-guide-center" aria-hidden="true" style={{ pointerEvents:'none' }} />}
    </div>
  );
}
