import { useCallback, useEffect, useRef, useState } from 'react';
import { getModelValue } from '@/config/models.js';

/**
 * 무한 스크롤 + 서버 로딩 훅
 * - 의존성은 객체(params) 말고, 개별 값(q, qBy, aspect, sort)로 분리
 * - 로딩/중복 요청 가드(inflightRef) 추가
 * - 로딩 중에는 센티넬 attach 안 함
 */
export default function useInfiniteLibrary({ access, api, q, qBy, aspect, sort }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  // 중복 요청 방지
  const inflightRef = useRef(false);

  const fetchPage = useCallback(async ({ reset = false } = {}) => {
    if (!access) return;
    if (inflightRef.current) return;
    inflightRef.current = true;

    try {
      if (reset) {
        setLoading(true);
        setItems([]);
        setCursor(null);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      setError('');

      if(qBy == 1) q = String(getModelValue(q))

      const params = {
        q: q,
        qBy: qBy,
        aspect: aspect,
        sort,
        cursor: reset,
        limit: 24,
      };

      const { data } = await api.post('/gallery', params, {timeout: 1000 * 60 * 5});
      const list = Array.isArray(data?.result) ? data.result : (Array.isArray(data) ? data : []);
      const next = data?.nextCursor ?? null;

      setItems(prev => (reset ? list : [...prev, ...list]));

      // 더 불러올 수 있는지 판정
      if (next != null) {
        setCursor(next);
        setHasMore(list.length > 0); // next가 있어도 list가 0이면 재요청 방지
      } else {
        // cursor 없으면 더 없음
        setCursor(null);
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
      setError('이미지 목록을 불러오지 못했습니다.');
      if (reset) {
        setItems([]);
        setHasMore(false);
        setCursor(null);
      }
    } finally {
      inflightRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, [access, api, q, qBy, aspect, sort, cursor]);

  // 최초 + 적용값 변경 시에만 리셋 로드
  useEffect(() => {
    if (!access) return;
    fetchPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access, q, qBy, aspect, sort]); // fetchPage를 deps에서 제외해 무한 리셋 방지

  // 센티넬(무한 스크롤)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    // 더 불러올 게 없거나, 로딩 중이면 관찰하지 않음
    if (!hasMore || loading || loadingMore) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && !inflightRef.current) {
          fetchPage({ reset: false });
        }
      },
      { rootMargin: '600px 0px 600px 0px', threshold: 0.01 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, loadingMore, fetchPage]);

  return {
    loading,
    error,
    items,
    setItems,
    hasMore,
    loadingMore,
    sentinelRef,
    reload: () => fetchPage({ reset: true }),
  };
}
