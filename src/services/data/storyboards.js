// src/services/storyboards.js
const LS_KEY = 'orange:storyboards:v1';

function uid() {
  return 'sb_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}
function readAll() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
}
function writeAll(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {}
}

export function seedDemoStoryboards() {
  const cur = readAll();
  if (cur.length) return cur;
  const demo = [
    { id: uid(), title: '도시 배경 – 오프닝 컷', tags: ['#영화', '#코믹', '#작업중'], updatedAt: Date.now()-3600_000 },
    { id: uid(), title: '하이라이트 씬(비 오는 골목)', tags: ['#느와르', '#레퍼런스'], updatedAt: Date.now()-7200_000 },
    { id: uid(), title: '엔딩 롤 테스트', tags: ['#타이포', '#후반작업'], updatedAt: Date.now()-10800_000 },
  ];
  writeAll(demo);
  return demo;
}

export function listStoryboards({ q = '' } = {}) {
  const all = readAll();
  const kw = q.trim().toLowerCase();
  const filtered = kw
    ? all.filter(sb =>
        sb.title.toLowerCase().includes(kw) ||
        (sb.tags||[]).some(t => t.toLowerCase().includes(kw))
      )
    : all;
  return filtered.sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0));
}

export function createStoryboard({ title, tags = [] }) {
  const sb = { id: uid(), title: title?.trim() || '제목 없음', tags: tags.slice(0, 8), updatedAt: Date.now() };
  const all = readAll();
  all.unshift(sb);
  writeAll(all);
  return sb;
}

export function updateStoryboard(id, patch = {}) {
  const all = readAll();
  const i = all.findIndex(x => x.id === id);
  if (i < 0) return null;
  all[i] = { ...all[i], ...patch, updatedAt: Date.now() };
  writeAll(all);
  return all[i];
}

export function removeStoryboard(id) {
  const all = readAll().filter(x => x.id !== id);
  writeAll(all);
  return true;
}

export function getStoryboard(id) {
  return readAll().find(sb => sb.id === id) || null;
}

// 최대 6개 씬 보장 (없으면 플레이스홀더 생성)
export function ensureScenes(id, maxCount = 6) {
  const sb = getStoryboard(id);
  if (!sb) return null;
  const count = Math.min(maxCount, 6);
  const scenes = Array.isArray(sb.scenes) ? sb.scenes.slice(0, count) : [];
  for (let i = scenes.length; i < count; i++) {
    scenes.push({
      no: i + 1,
      title: `씬 ${i + 1}`,
      note: '',        // 메모
      image: '',       // 이미지 URL
    });
  }
  return updateStoryboard(id, { scenes });
}

// 특정 씬 갱신
export function updateScene(id, sceneNo, patch = {}) {
  const sb = getStoryboard(id);
  if (!sb) return null;
  const scenes = ensureScenes(id, 6)?.scenes || sb.scenes || [];
  const idx = scenes.findIndex(s => s.no === sceneNo);
  if (idx < 0) return null;
  scenes[idx] = { ...scenes[idx], ...patch };
  return updateStoryboard(id, { scenes });
}

// 씬 초기화(이미지/메모/제목 초기 상태로)
export function clearScene(id, sceneNo) {
  return updateScene(id, sceneNo, {
    title: `씬 ${sceneNo}`,
    note: '',
    image: '',
  });
}
