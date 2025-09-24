// src/Canvas/hooks/useGeneration.js
import { useCallback, useState } from 'react';
import api from '@/services/network/api.js';

// 응답에서 URL 추출
const pickImageUrl = (data) => {
  if (!data) return '';
  return (
    data.imageUrl ||
    data.url ||
    (Array.isArray(data.images) && data.images[0]?.url) ||
    (Array.isArray(data.output) && typeof data.output[0] === 'string' && data.output[0]) ||
    ''
  );
};

// 안전 변환 유틸(넘어온 값이 비어있지 않을 때만 숫자로 변환)
const toInt = (v) =>
  v === undefined || v === null || v === '' ? undefined : parseInt(v, 10);
const toFloat = (v) =>
  v === undefined || v === null || v === '' ? undefined : parseFloat(v);

export default function useGeneration({ getSaveDataURL }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [resultUrl, setResultUrl] = useState('');

  /**
   * generate({
   *   prompt, model, aspect, getUserNo,
   *   ksampler?: {
   *     seed?,                  // number
   *     controlAfterGenerate?,  // 'randomize' | 'fixed' | string
   *     step?,                  // number
   *     cfg?,                   // number
   *     samplerName?,           // string
   *     scheduler?,             // string
   *     denoise?                // number
   *   }
   * })
   */
  const generate = useCallback(async ({ prompt, model, aspect, getUserNo, ksampler }) => {
    if (!prompt?.trim() || isGenerating) return '';
    setError('');
    setResultUrl('');
    setIsGenerating(true);
    try {
      const init = getSaveDataURL?.() || '';

      // 기본 페이로드(기존 그대로)
      const payload = { prompt, init_image: init, model, aspect, "no": getUserNo() };

      // ✅ KSampler가 넘어오면 있는 키만 선택적으로 붙임(서버 기본값/랜덤 로직과 충돌 없음)
      if (ksampler) {
        const {
          seed,
          controlAfterGenerate,
          step,
          cfg,
          samplerName,
          scheduler,
          denoise,
        } = ksampler;

        if (controlAfterGenerate) payload.controlAfterGenerate = controlAfterGenerate;
        const _seed = toInt(seed);
        if (_seed !== undefined) payload.seed = _seed;

        const _step = toInt(step);
        if (_step !== undefined) payload.step = _step;

        const _cfg = toInt(cfg);
        if (_cfg !== undefined) payload.cfg = _cfg;

        if (samplerName) payload.samplerName = samplerName;
        if (scheduler) payload.scheduler = scheduler;

        const _denoise = toFloat(denoise);
        if (_denoise !== undefined) payload.denoise = _denoise;
      }

      // axios로 통신(타임아웃 유지) , { timeout: 1000 * 60 * 5 }
      const { data } = await api.post('/gen', payload);

      let url = pickImageUrl(data);
      if (url) {
        const host = import.meta.env.VITE_APP_FASTAPI_URL || "http://localhost:8000";
        url = `${host}/${url}`;
        setResultUrl(url);
        return url; // 호출자에게도 즉시 반환
      }
      setError('이미지 응답을 찾지 못했습니다.');
      return '';
    } catch (e) {
      console.error(e);
      setError('이미지 생성 중 오류가 발생했습니다.');
      return '';
    } finally {
      setIsGenerating(false);
    }
  }, [getSaveDataURL, isGenerating]);

  return { isGenerating, error, setError, resultUrl, setResultUrl, generate };
}
