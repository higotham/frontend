// src/services/http.js
import axios from 'axios';
import { getCookie } from '@services/core/Commons.js';

/** Create a preconfigured axios client */
export const createClient = (baseURL) => {
  const client = axios.create({
    baseURL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
  });
  // Attach access token when present
  client.interceptors.request.use(cfg => {
    const token = getCookie('access');
    if (token) cfg.headers['Authorization'] = `Bearer ${token}`;
    return cfg;
  });
  // Basic error logging
  client.interceptors.response.use(
    (res) => res,
    (err) => {
      console.error('HTTP error', err?.response || err);
      return Promise.reject(err);
    }
  );
  return client;
};

export const gateway = createClient(import.meta.env.VITE_APP_GATEWAY_URL || 'http://localhost:7000');
export const fastapi = createClient(import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000');

/** Generic request wrapper returning res.data */
export const http = async (method, url, { params, data, base='gateway' } = {}) => {
  const client = base === 'fastapi' ? fastapi : gateway;
  const res = await client.request({ method, url, params, data });
  return res.data;
};

export const GET = (url, params, opts) => http('GET', url, { params, ...(opts || {}) });
export const POST = (url, data, opts) => http('POST', url, { data, ...(opts || {}) });
export const PUT = (url, data, opts) => http('PUT', url, { data, ...(opts || {}) });
export const DELETE = (url, params, opts) => http('DELETE', url, { params, ...(opts || {}) });

export const FileUpload = async (url, formData, opts) => {
  const client = (opts?.base === 'fastapi') ? fastapi : gateway;
  const res = await client.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
};

/** Backward-compat: FastAPI(method, url, data) */
export const FastAPI = (method, url, data) => http(method, url, { data, base: 'fastapi' });
