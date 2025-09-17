// src/config/models.js
export const MODEL_OPTIONS = [
  { value: 0, label: '실사',   desc: '사진 같은 결과' },
  { value: 1, label: '2D',    desc: '만화/일러스트 톤' },
  { value: 2, label: '2.5D',  desc: '반실사 에니메이션 풍' },
  { value: 3, label: '3D',    desc: 'CG 풍 이미지' },

];

export const getModelLabel = (value) => {
  return MODEL_OPTIONS.find(o => o.value === value)?.label || value;
}

export const getModelValue = (label) => {
  const data = MODEL_OPTIONS.find(o => o.label.includes(label))
  return data !== undefined ? data.value : -1;
}