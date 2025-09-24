// src/Canvas/hooks/useDrafts.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { saveDraft, getDraftById, getLastDraft } from '@/services/data/drawings.js';

export default function useDrafts({
  access,
  draftParam,                 // 'last' | <id> | null
  getSaveDataURL,             // () => dataURL
  loadFromDataURL,            // (dataURL) => Promise
  metaDeps = {},              // { tool, color, size, aspect, ... }
  onLoaded,                   // (doc) => void (prompt/model 등 set)
  getAdditionalDraftFields,   // () => object | null (예: { prompt, model, initImageDataURL })
}) {
  const [draftId, setDraftId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastSavedSig, setLastSavedSig] = useState('');
  const [dirtyAt, setDirtyAt] = useState(0);
  const loadedIdRef = useRef(null);

  const sigOf = (dataUrl) => (dataUrl ? `${dataUrl.length}:${dataUrl.slice(0, 128)}` : '');

  const encode = (param) => {
    return window.btoa(encodeURIComponent(param))
  }

  const saveNow = useCallback(async () => {
    const imageDataURL = getSaveDataURL?.();
    const sig = sigOf(imageDataURL);
    let saved = null;
    if (!imageDataURL || sig === lastSavedSig) return;

    setSaving(true);
    try {
      // 기본 페이로드
      const payload = {
        id: draftId,
        imageDataURL,
        meta: { ...metaDeps, dpr: window.devicePixelRatio || 1 },
      };

      // 추가 필드 병합 (예: prompt, model, initImageDataURL 등)
      const extra = typeof getAdditionalDraftFields === 'function'
        ? getAdditionalDraftFields()
        : null;
      if (extra && typeof extra === 'object') Object.assign(payload, extra);

      saved = await saveDraft(payload);
      if (!draftId && saved?.id) setDraftId(saved.id);
      setLastSavedSig(sig);
    } finally {
      setSaving(false);
      return saved == null ? null : encode(JSON.stringify(saved))
    }
  }, [draftId, getSaveDataURL, lastSavedSig, metaDeps, getAdditionalDraftFields]);

  const markDirty = useCallback(() => setDirtyAt(Date.now()), []);

  // 디바운스 자동 저장
  // useEffect(() => {
  //   if (!access || !dirtyAt) return;
  //   const t = setTimeout(() => { saveNow().catch(() => {}); }, 1200);
  //   return () => clearTimeout(t);
  // }, [access, dirtyAt, saveNow]);

  // beforeunload 저장
  // useEffect(() => {
  //   const handler = () => { try { saveNow(); } catch {} };
  //   window.addEventListener('beforeunload', handler);
  //   return () => window.removeEventListener('beforeunload', handler);
  // }, [saveNow]);

  // 드래프트 로드
  useEffect(() => {
    if (!access) return;
    const q = draftParam;
    (async () => {
      let doc = null;
      // if (q === 'last') doc = await getLastDraft(); 
      // else if (q) doc = await getDraftById(q);

      if(q) doc = await getLastDraft();
      if (!doc?.imageDataURL) return;

      if (loadedIdRef.current === doc.id) return; // 같은 문서 재로드 방지
      loadedIdRef.current = doc.id;

      await loadFromDataURL(doc.imageDataURL);
      setDraftId(doc.id);
      setLastSavedSig(sigOf(doc.imageDataURL));
      onLoaded?.(doc);
    })();
  }, [access, draftParam, loadFromDataURL, onLoaded]);

  return {
    draftId,
    saving,
    saveNow,
    markDirty,
    lastSavedSig,
    setLastSavedSig,
    getDraftById,
  };
}
