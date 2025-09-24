// src/components/Canvas/LoadingIndicator.jsx
/**
 * 우상단 로딩 인디케이터
 * - visible=true일 때만 표시
 * - 오렌지 아이콘 + 회전 링 + 인디케이터 바(불규칙 진행)
 */
export default function LoadingIndicator({ visible, text = '이미지 생성 중…' }) {
  if (!visible) return null;

  return (
    <div className="loading-indicator" role="status" aria-live="polite">
      <div className="li-card">
        <div className="li-row">
          <div className="li-rotor" aria-hidden>
            <span className="li-orange" />
          </div>
          <div className="li-text">
            <div className="li-title">{text}</div>
            <div className="li-bar">
              <span className="li-bar-inner" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
