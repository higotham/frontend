// src/components/Canvas/Stage.jsx

export default function Stage({
  containerRef, canvasRef,
  onPointerEnter, onPointerLeave,
  onPointerDown, onPointerMove, onPointerUp,
  cursor = { x: 0, y: 0, visible: false },   // ✅ 기본값
  brushSize = 8,                              // ✅ 기본값
  tool = 'brush',                              // ✅ 기본값
  overlay = null,
}) {
  // rCss = 반지름(px). 없으면 brushSize 기반으로 폴백
  const d = Math.max(
    4,
    Math.round(((cursor?.rCss ?? Math.max(2, (brushSize || 8) / 2)) * 2))
  );
  const x = typeof cursor?.x === 'number' ? cursor.x : 0;
  const y = typeof cursor?.y === 'number' ? cursor.y : 0;
  const on = !!cursor?.visible;

  return (
    <div
      className="stage"
      ref={containerRef}
      data-tool={tool}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
      style={{ position: 'relative' }}   // ⬅️ 오버레이 absolute 기준
    >
    
      <canvas ref={canvasRef} className="paint-canvas" />
      {overlay}
      {/* 커서 원 오버레이 (널 안전) */}
      <div
        className={`cursor-dot ${on ? 'is-on' : ''} ${tool === 'eraser' ? 'is-eraser' : 'is-brush'}`}
        style={{ left: `${x}px`, top: `${y}px`, width: `${d}px`, height: `${d}px` }}
        aria-hidden
      />
    </div>
  );
}
