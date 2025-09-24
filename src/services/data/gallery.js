// src/services/gallery.js
const LS_IMG_KEY = 'orange:gallery:v1';

function readImgs() {
  try { return JSON.parse(localStorage.getItem(LS_IMG_KEY)) || []; } catch { return []; }
}
function writeImgs(list) { // (선택) 나중에 업로드/삭제 연동 시 필요
  try { localStorage.setItem(LS_IMG_KEY, JSON.stringify(list)); } catch {}
}


export function listImages() {
  return readImgs();
}

