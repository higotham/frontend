import axios from 'axios';
import { getCookie } from '@/services/core/Commons.js'

const authorization = () => {
  if(getCookie("access")) {
    return {'Content-Type': 'application/json', "Authorization" : `Bearer ${getCookie("access")}`}
  } else {
    return {'Content-Type': 'application/json'}
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_FASTAPI_URL || 'http://localhost:8000',  // FastAPI 등 백엔드 주소
  withCredentials: true,             // 세션/쿠키 사용 시
  headers: authorization()
});

// (옵션) 인터셉터
api.interceptors.response.use(
  res => res,
  err => {
    console.error('API error', err?.response || err);
    return Promise.reject(err);
  }
);

export default api;
