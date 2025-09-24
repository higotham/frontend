import aspectLabel from '../utils/aspectLabel.js';
import { useRoot } from '@/services/core/RootProvider.jsx'

export default function Gallery({
  loading,
  items,
  selectMode,
  selected,
  onToggleSelect,
  onOpen,
}) {
  const { getBoardFile } = useRoot();
  return (
    <section className="gallery" aria-live="polite">
      {loading && (
        <>
          <div className="skeleton tall" />
          <div className="skeleton wide" />
          <div className="skeleton sq" />
          <div className="skeleton mid" />
          <div className="skeleton tall" />
          <div className="skeleton mid" />
        </>
      )}

      {!loading && items.map((it) => {
        const id = it.no || it.url;
        const isSel = selected.has(id);
        return (
          <figure
            key={id}
            className={`gallery-item ${selectMode ? 'is-selectable' : ''} ${isSel ? 'is-selected': ''}`}
            onClick={() => {
              if (selectMode) onToggleSelect(id);
              else onOpen(it);
            }}
          >
            <img src={getBoardFile(it.attachPath)} alt={it.prompt || '생성 이미지'} loading="lazy" />
            {(it.width && it.height) && (
              <span className="ratio-badge">{aspectLabel(it.width, it.height)}</span>
            )}
            {selectMode && (
              <span className="sel-check" aria-hidden>{isSel ? '☑' : '☐'}</span>
            )}
          </figure>
        );
      })}
    </section>
  );
}
