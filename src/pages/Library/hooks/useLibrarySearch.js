import { useCallback, useMemo, useState } from 'react';

const DEFAULTS = { q:'', qBy:0, aspect:-1, sort:'newest' };

export default function useLibrarySearch() {
  // draft: UI 입력 단계 (요청 X)
  const [qDraft, setQDraft] = useState(DEFAULTS.q);
  const [qByDraft, setQByDraft] = useState(DEFAULTS.qBy);
  const [aspectDraft, setAspectDraft] = useState(DEFAULTS.aspect);
  const [sortDraft, setSortDraft] = useState(DEFAULTS.sort);

  // applied: 실제 서버 파라미터 (요청 O)
  const [q, setQ] = useState(DEFAULTS.q);
  const [qBy, setQBy] = useState(DEFAULTS.qBy);
  const [aspect, setAspect] = useState(DEFAULTS.aspect);
  const [sort, setSort] = useState(DEFAULTS.sort);

  const applySearch = useCallback((overrides) => {
    const next = {
      q:      overrides?.q      ?? qDraft.trim(),
      qBy:    overrides?.qBy    ?? qByDraft,
      aspect: overrides?.aspect ?? aspectDraft,
      sort:   overrides?.sort   ?? sortDraft,
    };
    setQ(next.q);
    setQBy(next.qBy);
    setAspect(next.aspect);
    setSort(next.sort);
    return next; // 필요 시 상위에서 활용
  }, [qDraft, qByDraft, aspectDraft, sortDraft]);

  const resetDraftAndApply = useCallback(() => {
    setQDraft(DEFAULTS.q);
    setQByDraft(DEFAULTS.qBy);
    setAspectDraft(DEFAULTS.aspect);
    setSortDraft(DEFAULTS.sort);
    return applySearch(DEFAULTS);
  }, [applySearch]);

  const hasAnyFilter = useMemo(
    () => !!q || aspect !== 'all' || sort !== 'newest' || (qBy && qBy !== 'prompt'),
    [q, qBy, aspect, sort]
  );

  return {
    // draft
    qDraft, setQDraft,
    qByDraft, setQByDraft,
    aspectDraft, setAspectDraft,
    sortDraft, setSortDraft,

    // applied
    q, qBy, aspect, sort,

    // actions
    applySearch,
    resetDraftAndApply,
    hasAnyFilter,
    DEFAULTS
  };
}
