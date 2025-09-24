
export default function ResultFab({ open, onOpenChange }) {
  const toggle = () => onOpenChange?.(!open);
  return (
    <button
      className="aiw-fab-result"
      aria-pressed={open ? 'true' : 'false'}
      aria-label={open ? '결과 닫기' : '결과 열기'}
      onClick={toggle}
      type="button"
    >
      {open ? '닫기' : '결과'}
    </button>
  );
}