import { createContext, useContext, useState, useEffect } from "react"
import { useCookies } from 'react-cookie';
import { decode, encode } from '@/services/core/Commons.js'
import { jwtDecode } from 'jwt-decode';

export const RootContext = createContext()

const RootProvider = ({children}) => {
  const [tab, setTab] = useState('drawing'); // 'drawing' | 'library'
  const [access, setAccess] = useState(false)
  const [cookies, setCookie, removeCookie] = useCookies(['ck']);

  const DEFAULT_AVATAR =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#B6F09C"/><stop offset="1" stop-color="#7ED957"/>
      </linearGradient></defs>
      <rect width="128" height="128" rx="64" fill="url(#g)"/>
      <circle cx="64" cy="52" r="22" fill="#fff" opacity="0.95"/>
      <path d="M28 106c5-18 20-30 36-30s31 12 36 30" fill="#fff" opacity="0.95"/>
    </svg>`);

  const baseUrl = import.meta.env.VITE_APP_GATEWAY_URL || 'http://localhost:7000';
  const getFile = (fileNo) => {
    if(fileNo == null) return DEFAULT_AVATAR
    return baseUrl + "/oauth/file/u/" + fileNo
  }

  const baseUrl2 = import.meta.env.VITE_APP_FASTAPI_URL || 'http://localhost:8000';
  const getBoardFile = (path) => {
    if(path == null) return None
    return baseUrl2 + "/" + path
  }

  const setStorage = (name, token) => {
    setCookie(name, encode(token));
    return true;
  }
  
  const getStorage = (name) => {
    return cookies[name] == undefined ? null : decode(cookies[name]);
  }
  
  const isStorage = (name) => {
    return getStorage(name) === null ? false : true;
  }
  
  const removeStorage = (name) => {
    removeCookie(name);
    location.reload();
  }

  const getUserNo = () => {
    if(isStorage("access")) {
      const decoded = jwtDecode(getStorage("access"));
      return decoded.userNo;
    } else {
      return 0;
    }
  }

  useEffect(() => {
    if(isStorage("access")) setAccess(true)
  }, [])

  return (
      <RootContext.Provider value={{ access, setStorage, removeStorage, tab, setTab, DEFAULT_AVATAR, getUserNo, getFile, getBoardFile }}>
        {children}
      </RootContext.Provider>
    )
}

export const useRoot = () => useContext(RootContext);

export default RootProvider