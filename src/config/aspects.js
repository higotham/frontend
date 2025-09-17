// src/config/aspects.js
export const ASPECT_OPTIONS = [
  { value: 0,   label: '1:1' },
  { value: 1,   label: '4:3' },
  { value: 2,   label: '3:4' },
  { value: 3,  label: '16:9' },
  { value: 4,  label: '9:16' },
];

export const getAspectLabel = (value) => {
  if(typeof(value) !== "number") value = Number(value);
  return ASPECT_OPTIONS.find(o => o.value === value)?.label || '1:1';
}

export const getAspectValue = (label) => {
  const data = ASPECT_OPTIONS.find(o => o.label.includes(label))
  return data !== undefined ? data.value : -1;
}