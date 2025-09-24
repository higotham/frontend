// src/pages/StoryboardLibrary.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StoryboardCard from '@/pages/Storyboard/components/StoryboardCard.jsx';
import {
  seedDemoStoryboards,
  listStoryboards,
  createStoryboard,
  removeStoryboard,
} from '@/services/data/storyboards.js';

import { useRoot } from '@/services/core/RootProvider.jsx'
import { FastAPI } from '@/services/network/Network.js'

const PAGE_SIZE = 20;

const StoryboardLibrary2 = () => {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  // 선택 삭제 모드 & 선택 상태
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set()); // 현재 페이지 한정 선택

  const navigate = useNavigate();

  const refresh = () => setItems(listStoryboards({ q }));

  useEffect(() => { seedDemoStoryboards(); refresh(); }, []);
  useEffect(() => { setPage(1); setSelected(new Set()); refresh(); }, [q]); // 검색 시 초기화

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  // 페이지 이동 시 현재 선택 초기화(페이지 한정 선택 정책)
  useEffect(() => {
    setSelected(new Set());
  }, [page]);

  // 새로 만들기
  const onQuickAdd = () => {
    const title = window.prompt('스토리보드 제목을 입력하세요', '');
    if (title == null) return;
    const tagLine = window.prompt('메모/태그를 쉼표로 구분해 입력 (예: #영화,#코믹,#작업중)', '#영화,#코믹,#작업중');
    const tags = (tagLine || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 8);
    createStoryboard({ title, tags });
    setPage(1); // 최신 항목을 1페이지에서 보이도록
    refresh();
  };

  // 선택 토글
  const toggleItem = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // 선택 모드 토글
  const toggleSelectMode = () => {
    setSelectMode(v => {
      const nv = !v;
      if (!nv) setSelected(new Set()); // 선택 모드 해제 시 선택 초기화
      return nv;
    });
  };

  // 선택 삭제
  const deleteSelected = () => {
    if (selected.size === 0) {
      window.alert('선택된 스토리보드가 없습니다.');
      return;
    }
    const ok = window.confirm('정말로 삭제하시겠습니까?');
    if (!ok) return;
    for (const id of selected) removeStoryboard(id);
    setSelected(new Set());
    setSelectMode(false);
    refresh();
  };

  // 총 페이지 수가 줄었을 때 보정
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [items, totalPages, page]);

  const empty = items.length === 0;
  const showPagination = items.length > PAGE_SIZE;

  return (
    <main className="sb-page" aria-label="스토리보드 라이브러리">
      <div className="container">
        {/* 툴바 */}
        {/* <div className="d-flex align-items-center gap-2 sb-toolbar"> */}
        <div className="sb-grid-body gap-2 sb-toolbar">
          {/* ✅ 제목: 가로 고정 + 말줄임 */}
          <h2 className="m-0 sb-lib-title">📑 스토리보드</h2>

          {/* ✅ 검색: 인라인 minWidth 제거 -> CSS로 제어 */}
          <div className='sb-grid-sub gap-2'>
            <div className="input-group sb-search">
              <span className="input-group-text" id="lbl-search">검색</span>
              <input
                className="form-control"
                placeholder="제목 · #태그 검색"
                aria-labelledby="lbl-search"
                value={q}
                onChange={e=>setQ(e.target.value)}
              />
            </div>

            {!selectMode ? (
              <div className='btn-group'>
                <button className="btn btn-success" onClick={onQuickAdd}>+ 새 스토리보드</button>
                <button className="btn btn-outline-danger" onClick={toggleSelectMode}>삭제</button>
              </div>
            ) : (
              <div className='btn-group'>
                <button className="btn btn-danger" onClick={deleteSelected}>선택 삭제</button>
                <button className="btn btn-outline-secondary" onClick={toggleSelectMode}>취소</button>
              </div>
            )}
          </div>
        </div>

        {empty ? (
          <section className="sb-empty">
            <p className="lead">아직 스토리보드가 없습니다.</p>
            <button className="btn btn-primary" onClick={onQuickAdd}>지금 만들기</button>
          </section>
        ) : (
          <>
            <div className="row g-3 sb-grid">
              {pageItems.map(item => (
                <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={item.id}>
                  <StoryboardCard
                    item={item}
                    selectable={selectMode}
                    checked={selected.has(item.id)}
                    onToggle={() => toggleItem(item.id)}
                    onOpen={() => navigate(`/storyboards/${item.id}`)}
                  />
                </div>
              ))}
            </div>

            {showPagination && (
              <nav className="mt-3 sb-pagination" aria-label="스토리보드 페이지 매김">
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${page===1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={()=>setPage(p=>Math.max(1, p-1))} aria-label="이전">«</button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <li key={n} className={`page-item ${page===n ? 'active' : ''}`}>
                      <button className="page-link" onClick={()=>setPage(n)}>{n}</button>
                    </li>
                  ))}

                  <li className={`page-item ${page===totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={()=>setPage(p=>Math.min(totalPages, p+1))} aria-label="다음">»</button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}

const StoryboardLibrary = () => {
  const { getUserNo } = useRoot();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [pageItems, setPageItems] = useState([]);
  const navigate = useNavigate();
  const showPagination = pageItems.length > PAGE_SIZE;

  // 선택 토글
  const toggleItem = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // 선택 모드 토글
  const toggleSelectMode = () => {
    setSelectMode(v => {
      const nv = !v;
      if (!nv) setSelected(new Set()); // 선택 모드 해제 시 선택 초기화
      return nv;
    });
  };

  // 선택 삭제
  const deleteSelected = () => {
    if (selected.size === 0) {
      window.alert('선택된 스토리보드가 없습니다.');
      return;
    }
    const ok = window.confirm('정말로 삭제하시겠습니까?');
    if (!ok) return;
    const storyboards = Array.from(selected).join(",");
    FastAPI("DELETE", `/storyboard`, { storyboards })
    .then(res => {
      if(res.status) {
        location.reload()
      }
    })
  };

  // 새로 만들기
  const onQuickAdd = () => {
    const title = window.prompt('스토리보드 제목을 입력하세요', '');
    if (title == null) return;
    const tagLine = window.prompt('메모/태그를 쉼표로 구분해 입력 (예: #영화,#코믹,#작업중)', '#영화,#코믹,#작업중');
    FastAPI("PUT", "/storyboard", {title, "tag": tagLine, "regUserNo": getUserNo()})
    .then(res => {
      if(res.status) {
        location.reload()
      }
    })
  };

  useEffect(()=>{
    FastAPI("POST", "/storyboard",{q})
    .then(res => {
      if(res.status) {
        setPageItems(res.result)
      }
    })
  }, [q])
  
  return (
    <main className="sb-page" aria-label="스토리보드 라이브러리">
      <div className="container">

        <div className="sb-grid-body gap-2 sb-toolbar">
          <h2 className="m-0 sb-lib-title">📑 스토리보드</h2>

          <div className='sb-grid-sub gap-2'>
            <div className="input-group sb-search">
              <span className="input-group-text" id="lbl-search">검색</span>
              <input
                className="form-control"
                placeholder="제목 · #태그 검색"
                aria-labelledby="lbl-search"
                value={q}
                onChange={e=>setQ(e.target.value)}
              />
            </div>

            {!selectMode ? (
              <div className='btn-group'>
                <button className="btn btn-success" onClick={onQuickAdd}>+ 새 스토리보드</button>
                <button className="btn btn-outline-danger" onClick={toggleSelectMode}>삭제</button>
              </div>
            ) : (
              <div className='btn-group'>
                <button className="btn btn-danger" onClick={deleteSelected}>선택 삭제</button>
                <button className="btn btn-outline-secondary" onClick={toggleSelectMode}>취소</button>
              </div>
            )}
          </div>
        </div>

        {pageItems.length === 0 ? (
          <section className="sb-empty">
            <p className="lead">아직 스토리보드가 없습니다.</p>
            {/* <button className="btn btn-primary" onClick={onQuickAdd}>지금 만들기</button> */}
          </section>
        ) : (
          <>
            <div className="row g-3 sb-grid">
              {pageItems.map(item => (
                <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={item.no}>
                  <StoryboardCard
                    item={item}
                    selectable={selectMode}
                    checked={selected.has(item.no)}
                    onToggle={() => toggleItem(item.no)}
                    onOpen={() => navigate(`/storyboards/${item.no}`)}
                  />
                </div>
              ))}
            </div>

            {showPagination && (
              <nav className="mt-3 sb-pagination" aria-label="스토리보드 페이지 매김">
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${page===1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={()=>setPage(p=>Math.max(1, p-1))} aria-label="이전">«</button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <li key={n} className={`page-item ${page===n ? 'active' : ''}`}>
                      <button className="page-link" onClick={()=>setPage(n)}>{n}</button>
                    </li>
                  ))}

                  <li className={`page-item ${page===totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={()=>setPage(p=>Math.min(totalPages, p+1))} aria-label="다음">»</button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default StoryboardLibrary