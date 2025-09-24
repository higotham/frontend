// src/components/StoryboardCard.jsx
export default function StoryboardCard({
  item,
  selectable = false,   // ✅ 선택 모드 여부
  checked = false,       // ✅ 현재 카드 선택 여부
  onToggle,              // ✅ 체크박스 토글
  onOpen,                // ✅ 일반 열기(선택 모드가 아닐 때)
}) {
  const getTags = () => {
    return item.tag.split(",")
  }
  const tags = (getTags() || []).slice(0, 3);
  const more = (getTags() || []).length - tags.length;


  const handleCardClick = () => {
    if (selectable) {
      onToggle?.();
    } else {
      onOpen?.();
    }
  };

  return (
    <div
      className={`card sb-card h-100 ${selectable ? 'selectable' : ''}`}
      role="button"
      onClick={handleCardClick}
      aria-label={selectable ? `${item.title} 선택` : `${item.title} 열기`}
    >
      {/* ✅ 선택 모드에서만 체크박스 표시 */}
      {selectable && (
        <label
          className="sb-checkwrap"
          onClick={(e) => e.stopPropagation()} // 카드 클릭 이벤트 차단
        >
          <input
            type="checkbox"
            className="form-check-input"
            checked={checked}
            onChange={onToggle}
            aria-label="스토리보드 선택"
          />
        </label>
      )}

      <div className="sb-thumb" aria-hidden="true">
        <div className="sb-thumb-placeholder">🗂️</div>
      </div>

      <div className="card-body d-flex flex-column">
        <h6 className="card-title sb-title" title={item.title}>{item.title}</h6>
        <div className="mt-auto sb-tags">
          {tags.map((t,i) => (
            <span key={i} className="badge bg-light text-dark sb-tag">{t}</span>
          ))}
          {more > 0 && <span className="badge bg-secondary sb-tag">+{more}</span>}
        </div>
      </div>
    </div>
  );
}
