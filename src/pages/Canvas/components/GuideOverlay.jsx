import React from 'react';

/**
 * GuideOverlay
 * - Stage 위에 “항상” 떠 있는 점자/가이드 오버레이
 * - 사라짐 방지: 부모에 isolation:isolate, 오버레이 z-index 고정
 */
export default function GuideOverlay({ show = true, children = null }) {
  if (!show) return null;
  return (
    <div className="aiw-guide-container">
      <div className="aiw-guide-overlay" aria-hidden>
        <div className="dotgrid" />
        {children /* 필요하면 라벨/가이드 추가 */}
      </div>
    </div>
  );
}
