// src/components/Common/ImagePickerModal.jsx
import { useEffect, useState, useCallback } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useRoot } from '@/services/core/RootProvider.jsx';
import api from '@/services/network/api.js';
import { getModelLabel } from '@/config/models.js';
import { getModelValue } from '@/config/models.js';
import { getAspectLabel } from '@/config/aspects.js';

export default function ImagePickerModal({ show, onClose, onSelect }) {
  const { getBoardFile } = useRoot();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // 검색 상태
  const [q, setQ] = useState('');
  const [qBy, setQBy] = useState(0); // 0: prompt, 1: model

  // ✅ q/qBy에 의존하지 않는 fetch 함수 (파라미터로만 동작)
  const fetchList = useCallback(async (qParam = '', qByParam = 0) => {
    try {
      setLoading(true);
      // Day5: 모델 검색어를 value로 정규화
      let qFixed = qParam;
      if (Number(qByParam) === 1) {
        const v = getModelValue(String(qParam).trim());
        qFixed = v !== -1 ? String(v) : String(qParam).trim();
      }
      const params = {
        cursor: null,
        q: qFixed,
        qBy: Number(qByParam),
        aspect: -1,
        sort: 'newest',
        limit: 50,
      };
      const { data } = await api.post('/gallery', params, { timeout: 1000 * 60 * 5 });
      setItems(Array.isArray(data?.result) ? data.result : []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ 모달 열릴 때만 기본 조회 (의존성: show 만)
  useEffect(() => {
    if (!show) return;
    setQ(''); setQBy(0);
    (async () => {
      try {
        setLoading(true);
        const params = { cursor: null, q: '', qBy: 0, aspect: -1, sort: 'newest', limit: 50 };
        const { data } = await api.post('/gallery', params, { timeout: 1000 * 60 * 5 });
        setItems(Array.isArray(data?.result) ? data.result : []);
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [show]);

  // 제출 (Enter/검색 버튼에서만)
  const onSubmit = (e) => {
    e.preventDefault();
    fetchList(q, qBy);
  };

  const onReset = () => {
    setQ(''); setQBy(0);
    fetchList('', 0);
  };

  const isEmpty = !loading && items.length === 0;

  return (
    <Modal show={show} onHide={onClose} centered dialogClassName="ipm-dialog">
      <Modal.Header closeButton>
        <Modal.Title>이미지 선택</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* 상단 검색 툴바 */}
        <form className="ipm-toolbar" onSubmit={onSubmit}>
          <div className="ipm-search">
            <select
              className="ipm-select"
              aria-label="검색 대상"
              value={qBy}
              onChange={(e) => setQBy(Number(e.target.value))}
            >
              <option value={0}>프롬프트</option>
              <option value={1}>모델</option>
            </select>

            <input
              type="search"
              className="ipm-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={qBy === 1 ? '모델명으로 검색' : '프롬프트로 검색'}
              aria-label="검색어"
            />
          </div>

          <div className="ipm-actions">
            <button type="submit" className="btn btn-mini ipm-btn-search" disabled={loading}>
              {loading ? '검색 중…' : '검색'}
            </button>
            <button
              type="button"
              className="btn btn-mini ipm-btn-reset"
              onClick={onReset}
              disabled={loading || (q === '' && qBy === 0)}
            >
              초기화
            </button>
          </div>
        </form>

        {loading && <div className="text-center py-4">불러오는 중…</div>}
        {isEmpty && <div className="text-center py-4"><p className="text-muted mb-0">검색 결과가 없습니다.</p></div>}

        {!loading && !isEmpty && (
          <ul className="ipm-list" role="listbox" aria-label="이미지 목록">
            {items.map((it) => {
              return (
                <li key={it.no} className="ipm-item" role="option" aria-selected="false">
                  <button type="button" className="ipm-row" onClick={() => onSelect?.(it)} title={it.prompt}>
                    <div className="ipm-thumb">
                      {it.attachPath ? <img src={getBoardFile(it.attachPath)} alt="" loading="lazy" /> : <span className="ipm-ph">No Image</span>}
                    </div>
                    <div className="ipm-meta">
                      <div className="ipm-title">{it.prompt}</div>
                      <div className="ipm-sub">
                        <span className="ipm-badge">{getAspectLabel(it.ratio)}</span>
                        <span className="ipm-badge">{getModelLabel(it.model)}</span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Modal.Body>
    </Modal>
  );
}
