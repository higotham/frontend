import { useRoot } from '@/services/core/RootProvider.jsx'
import { getModelLabel } from '@/config/models.js';
import { getAspectLabel } from '@/config/aspects.js';

export default function Lightbox({ open, item, onClose }) {
  const { getBoardFile } = useRoot();
  if (!open || !item) return null;
  return (
    <>
      <div className="lib-scrim" onClick={onClose} />
      <div className="lib-lightbox" role="dialog" aria-modal="true">
        <div className="lib-lightbox-head">
          <strong>상세 보기</strong>
          <div className="spacer" />
          <button className="btn-close" aria-label="닫기" onClick={onClose} />
        </div>
        <div className="lib-lightbox-body">
          <img src={getBoardFile(item.attachPath)} alt={item.prompt ?? '이미지'} />
          <div className="lib-meta">
            <div className="meta-row"><b>프롬프트</b><span>{item.prompt}</span></div>
            <div className="meta-row"><b>모델</b><span>{getModelLabel(item.model)}</span></div>
            <div className="meta-row"><b>비율</b><span>({getAspectLabel(item.ratio)})</span></div>
            <div className="meta-actions">
              <a className="btn btn-mini" href={getBoardFile(item.attachPath)} target="_blank" rel="noreferrer">새 탭에서 보기</a>
              <a className="btn btn-mini" href={getBoardFile(`download/${item.fileNo}`)} target="_blank">다운로드</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
