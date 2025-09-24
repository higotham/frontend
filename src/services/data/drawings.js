// src/services/drawings.js
// 🔸 캔버스 전용 로컬 드래프트 저장소 (쓰기 범위 가드 + 안정성 보강)

const LS_LAST_ID = 'orange:lastDraftId';
const LS_KEY = (id) => `orange:draft:${id}`;
const LS_PREFIX = 'orange:draft:';

// ---- 런타임/환경 유틸 ----------------------------------------------------

const decode = (param) => {
  return decodeURIComponent(window.atob(param))
}

const encode = (param) => {
  return window.btoa(encodeURIComponent(param))
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function storageAvailable() {
  if (!isBrowser()) return false;
  // try {
  //   const t = '__orange_test__';
  //   window.localStorage.setItem(t, '1');
  //   window.localStorage.removeItem(t);
  //   return true;
  // } catch {
  //   return false;
  // }
  return true;
}

// 쓰기 허용 라우트(prefix) – 기본은 /canvas 만
let ALLOWED_WRITE_PREFIXES = ['/canvas'];

/** 쓰기 허용 라우트(prefix) 변경 (예: ['/canvas','/lab/canvas']) */
export function setDraftWriteRoutes(prefixes = ['/canvas']) {
  if (Array.isArray(prefixes) && prefixes.length) {
    ALLOWED_WRITE_PREFIXES = prefixes;
  }
}

/** 현재 위치에서 쓰기 가능 여부 (디버깅용) */
export function isDraftWriteEnabledHere() {
  if (!isBrowser()) return false;
  const path = window.location?.pathname || '';
  return ALLOWED_WRITE_PREFIXES.some((pre) => path.startsWith(pre));
}

// ---- 내부 유틸 -----------------------------------------------------------

function genId() {
  return 'd_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}

function parseJSONSafe(s) {
  try { return JSON.parse(s); } catch { return null; }
}

function saveLastId(id) {
  try { localStorage.setItem(LS_LAST_ID, encode(id)); } catch {}
}

function getLastId() {
  try { return decode(localStorage.getItem(LS_LAST_ID)) || null; } catch { return null; }
}

function isQuotaError(e) {
  return (
    e &&
    (e.name === 'QuotaExceededError' ||
     e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
     e.code === 22)
  );
}

function readDraft(id) {
  try {
    const raw = decode(localStorage.getItem(LS_KEY(id)));
    return raw ? parseJSONSafe(raw) : null;
  } catch { return null; }
}

function readUnDraft(id) {
  try {
    const raw = localStorage.getItem(LS_KEY(id));
    return raw ? raw : null;
  } catch { return null; }
}

function writeDraftObject(obj) {
  localStorage.setItem(LS_KEY(obj.id), encode(JSON.stringify(obj)));
}

function listAllDraftMetas() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(LS_PREFIX)) continue;
      const v = parseJSONSafe(decode(localStorage.getItem(k)));
      if (v && v.id) {
        out.push({
          id: v.id,
          updatedAt: typeof v.updatedAt === 'number' ? v.updatedAt : 0,
          createdAt: typeof v.createdAt === 'number' ? v.createdAt : 0,
        });
      }
    }
  } catch {}
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}

function evictOldest(n = 1, excludeId = null) {
  const metas = listAllDraftMetas();
  const victims = metas
    .filter(m => m.id !== excludeId)
    .slice(-n); // updatedAt 오름차순 끝쪽 = 오래된 것
  try {
    for (const m of victims) {
      localStorage.removeItem(LS_KEY(m.id));
    }
  } catch {}
}

function mostRecentDraftOrNull() {
  const metas = listAllDraftMetas();
  if (metas.length === 0) return null;
  const top = metas[0];
  return readDraft(top.id);
}

// ---- 저장/로드 핵심 ------------------------------------------------------

function saveToLS(doc) {
  // ⛔️ 브라우저/스토리지 미가용 또는 라우트 미허용 시 저장 차단
  if (!storageAvailable() || !isDraftWriteEnabledHere()) {
    return null; // 저장/갱신/lastId 업데이트 모두 하지 않음
  }

  const now = Date.now();
  const existing = doc.id ? readDraft(doc.id) : null;
  const id = doc.id || genId();

  // 필드 기본값 + 기존 createdAt 유지
  const next = {
    id,
    imageDataURL: doc.imageDataURL || '',
    prompt: typeof doc.prompt === 'string' ? doc.prompt : '',
    model: doc.model || 'img2img_real',
    meta: { ...(doc.meta || {}) },
    createdAt: existing?.createdAt || doc.createdAt || now,
    updatedAt: now,
    schema: 1,
  };

  try {
    clearDraft();
    writeDraftObject(next);
  } catch (e) {
    // 용량 초과 시 오래된 것 정리 후 1회 재시도
    if (isQuotaError(e)) {
      evictOldest(2, id);
      try {
        writeDraftObject(next);
      } catch (e2) {
        console.warn('local save failed after eviction', e2);
        throw e2;
      }
    } else {
      console.warn('local save failed', e);
      throw e;
    }
  }

  // 항상 최근 ID 업데이트
  saveLastId(id);
  return next;
}

function loadFromLS(id) {
  if (!storageAvailable()) return null;
  return id ? readDraft(id) : null;
}

function loadLastFromLS() {
  if (!storageAvailable()) return null;

  // 1) 기록된 lastId 우선 시도
  const id = getLastId();
  const byId = id ? loadFromLS(id) : null;
  if (byId && byId.id) return byId;

  // 2) lastId가 유실/손상됐으면 최신 항목을 스캔해 복구
  const recent = mostRecentDraftOrNull();
  if (recent?.id) {
    saveLastId(recent.id); // 복구
    return recent;
  }
  return null;
}

function clearDraft() {
  try { 
    localStorage.removeItem(LS_LAST_ID);
    listAllDraftMetas().forEach((v, i) => localStorage.removeItem(LS_KEY(v.id)))
  } catch {}
}

// === 공개 API ===========================================================

/** 현재 캔버스를 저장 (캔버스 라우트에서만 실제 저장; 그 외 null 반환) */
export async function saveDraft({ id, imageDataURL, prompt, model, meta = {} }) {
  return saveToLS({ id, imageDataURL, prompt, model, meta });
}

/** 특정 드래프트 로드 */
export function getDraftById(id) {
  if (!id) return null;
  return readUnDraft(id);
  // return loadFromLS(id);
}

/** 마지막 드래프트 로드 (lastId 손상시 자동 복구) */
export async function getLastDraft() {
  return loadLastFromLS();
}

/** 마지막 드래프트 id 반환 (홈에서 navigate용) */
export function getLastDraftId() {
  return getLastId();
}

/** (옵션) 마지막 드래프트 초기화 */
export function clearLastDraft() {
  try { localStorage.removeItem(LS_LAST_ID); } catch {}
}

/** (옵션) 최근 n개 메타 조회 (디버깅/툴바용) */
export function listRecentDrafts(limit = 20) {
  if (!storageAvailable()) return [];
  return listAllDraftMetas().slice(0, limit);
}

