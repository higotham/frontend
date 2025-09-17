import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LoginModal from '@/pages/Auth/LoginModal.jsx';
import UserInfoModal from '@/pages/Auth/UserInfoModal.jsx';
import { useRoot } from '@/services/core/RootProvider.jsx';

export default function Header(){
  const { access, tab, setTab } = useRoot();
  const [show, setShow] = useState(false);
  const [showUser, setShowUser] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (new URLSearchParams(search).get('login') === '1') setShow(true);
  }, [search, pathname]);

  return (
    <header className="banner" aria-label="상단 배너">
      <div className="banner-inner">
        <>
          {/* 슬라이드 사이드바 (항상 렌더, class로 열림/닫힘 제어) */}
          <aside
            className={`sidebar floating slide ${sidebarOpen ? 'is-open' : ''}`}
            aria-label="작업 사이드바"
            aria-hidden={!sidebarOpen}
          >
            <div className="tabs" role="tablist" aria-label="Main Tabs">
              <button
                className={`btn btn-tab ${tab==='drawing' ? 'is-active' : ''}`}
                onClick={()=> {setTab('drawing'); navigate("/")}}
                id="btn-drawing"
              >🎨 드로잉</button>
              <button
                className={`btn btn-tab ${tab==='library' ? 'is-active' : ''}`}
                onClick={()=> {setTab('library'); navigate("/")}}
                id="btn-library"
              >📁 라이브러리</button>
            </div>
          </aside>

          {/* 오버레이 (열렸을 때만) */}
          {sidebarOpen && (
            <button
              className="sidebar-overlay"
              aria-label="사이드바 닫기"
              onClick={()=>setSidebarOpen(false)}
            />
          )}
        </>
        <div className="logo" aria-label="사이트 로고" style={{cursor:"pointer"}} onClick={()=>navigate("/")}>
          <span className="logo-dot" aria-hidden="true"></span>
          <span>Orange</span>
        </div>

        <nav className="actions" aria-label="사용자 동작">
          {access ?
            <>
              <button className="btn btn-login" onClick={()=>setShowUser(true)} aria-label="회원 정보 열기">회원 정보</button>
              <button
                id="menuToggle"
                className="menu-toggle burger"
                aria-label="사이드바 열기/닫기"
                aria-expanded={sidebarOpen}
                onClick={()=>setSidebarOpen(v=>!v)}
              >
                <span></span><span></span><span></span>
              </button>
            </>
          :
            <>
              <button className="btn btn-login" onClick={()=>setShow(true)}>로그인</button>
              <Link className="btn btn-signup" to="/signup">회원가입</Link>
            </>
          }
        </nav>
      </div>
      <LoginModal show={show} onHide={()=>setShow(false)} />
      <UserInfoModal show={showUser} onHide={()=>setShowUser(false)} />
    </header>
  );
}
