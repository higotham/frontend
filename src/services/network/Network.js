import axios from 'axios'
import { getCookie } from '@/services/core/Commons.js'

const config = { 
  baseURL: import.meta.env.VITE_APP_GATEWAY_URL || 'http://localhost:7000',
  withCredentials: true 
}

const authorization = (token) => {
  return {"Authorization" : "Bearer " + token}
}

export const GET = async (url, params) => {
  try {
    let conf = {...config, method: 'GET', url, params}
    if(getCookie("access")) conf = {...conf, headers : authorization(getCookie("access"))};
    const response = await axios(conf)
    return response.data
  } catch (err) {
    console.error(err)
    return {status: false}
  }
}

export const POST = async (url, data) => {
  try {
    let conf = {...config, method: 'POST', url, data}
    if(getCookie("access")) conf = {...conf, headers : authorization(getCookie("access"))};
    const response = await axios(conf)
    return response.data
  } catch (err) {
    console.error(err)
    return {status: false}
  }
}

export const PUT = async (url, data) => {
  try {
    let conf = {...config, method: 'PUT', url, data}
    if(getCookie("access")) conf = {...conf, headers : authorization(getCookie("access"))};
    const response = await axios(conf)
    return response.data
  } catch (err) {
    console.error(err)
    return {status: false}
  }
}

export const PATCH = async (url, data) => {
  try {
    let conf = {...config, method: 'PATCH', url, data}
    if(getCookie("access")) conf = {...conf, headers : authorization(getCookie("access"))};
    const response = await axios(conf)
    return response.data
  } catch (err) {
    console.error(err)
    return {status: false}
  }
}

export const FileUpload = async (url, data) => {
  try {
    let conf = {...config, method: 'PATCH', url, data}
    let headers = authorization(getCookie("access"))
    headers = {...headers, "Content-Type": "multipart/form-data"}
    if(getCookie("access")) conf = {...conf, headers};
    const response = await axios(conf)
    return response.data
  } catch (err) {
    console.error(err)
    return {status: false}
  }
}

export const DELETE = async (url, data) => {
  try {
    let conf = {...config, method: 'DELETE', url, data}
    if(getCookie("access")) conf = {...conf, headers : authorization(getCookie("access"))};
    const response = await axios(conf)
    return response.data
  } catch (err) {
    console.error(err)
    return {status: false}
  }
}

export const FastAPI = async (method, url, data) => {
  try {
    let conf = {
      baseURL: import.meta.env.VITE_APP_FASTAPI_URL || "http://localhost:8000",
      method: method,
      url: url,
      data
    }
    if(getCookie("access")) conf = {...conf, headers : authorization(getCookie("access"))};
    const response = await axios(conf)
    return response.data
  } catch (err) {
    console.error(err)
    return {status: false, target: "FastAPI"}
  }
}