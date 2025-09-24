import React, { useState, useEffect } from 'react';
import api from '@/services/network/api.js';
import { useRoot } from '@/services/core/RootProvider.jsx';

import useLibrarySearch from '@/pages/Library/hooks/useLibrarySearch.js';
import useInfiniteLibrary from '@/pages/Library/hooks/useInfiniteLibrary.js';
import useSelection from '@/pages/Library/hooks/useSelection.js';

import Lightbox from '@/pages/Library/components/Lightbox.jsx';
import LibraryToolbar from '@/pages/Library/components/LibraryToolbar.jsx';
import Gallery from '@/pages/Library/components/Gallery.jsx';
import { FastAPI } from '@/services/network/Network.js';

export default function Library(){
  const { access, getUserNo } = useRoot();
  const [active, setActive] = useState(null);

  // 검색/필터 상태 (draft ↔ applied)
  const search = useLibrarySearch();

  // 데이터 로딩 (applied 값만 의존)
  const {
    loading, error, items, setItems,
    hasMore, loadingMore, sentinelRef, reload
   } = useInfiniteLibrary({
    access,
    api,
    q: search.q,
    qBy: search.qBy,
    aspect: search.aspect,
    sort: search.sort,
  });

  // 삭제 선택 모드
  const {
    selectMode, selected,
    enterDeleteMode, cancelDeleteMode, clearSelection, toggleSelect
  } = useSelection();

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`선택한 ${selected.size}개 이미지를 삭제할까요?`)) return;
    try {
      const gallerys = Array.from(selected).join(",");
      FastAPI("DELETE", "/gallery", { ids: gallerys, userNo: getUserNo() })
      .then(res => {
        if(res.status) {
          // setItems(prev => prev.filter(it => !selected.has(it.id || it.url)));
          cancelDeleteMode();
          reload();
        }
      })
      // await api.delete('/gallery', { ids: gallerys, userNo: getUserNo() }, { timeout: 30000 })
    } catch (e) {
      console.error(e);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    search.applySearch();
  }, [search.aspectDraft, search.sortDraft])

  if (!access) return null;

  return (
    <div className="library-page">
      <header className="lib-head">
        <h1>이미지 갤러리</h1>
        <div className="spacer" />
        <div className="lib-info">{items.length}개</div>
      </header>

      {/* 툴바 */}
      <LibraryToolbar
        // drafts
        qDraft={search.qDraft} setQDraft={search.setQDraft}
        qByDraft={search.qByDraft} setQByDraft={search.setQByDraft}
        aspectDraft={search.aspectDraft} setAspectDraft={search.setAspectDraft}
        sortDraft={search.sortDraft} setSortDraft={search.setSortDraft}

        // actions
        onApplySearch={()=>{
          // draft → applied (요청은 내부 훅들이 처리)
          search.applySearch();
          // 검색 시 혼동 방지: 선택모드 해제
          clearSelection();
        }}

        // delete flow
        selectMode={selectMode}
        selectedCount={selected.size}
        onEnterDeleteMode={enterDeleteMode}
        onCancelDeleteMode={cancelDeleteMode}
        onBulkDelete={bulkDelete}
      />

      {/* 에러 */}
      {error && <p className="lib-err">{error}</p>}

      {/* 빈 상태 */}
      {!loading && items.length === 0 && (
        <div className="lib-empty">
          <div className="ico" aria-hidden>🗂️</div>
          <div className="t1">아직 저장된 이미지가 없어요</div>
          <div className="t2">
            {search.hasAnyFilter ? '필터를 지워보세요. 조건에 맞는 이미지가 없어요.' : '캔버스에서 이미지를 생성하면 이곳에 모여요.'}
          </div>
          {search.hasAnyFilter && (
            <button
              className="btn btn-mini mt8"
              onClick={()=>{
                const next = search.resetDraftAndApply(); // 기본값으로 적용
                // 적용 후 선택모드도 해제
                cancelDeleteMode();
              }}
            >
              필터 초기화
            </button>
          )}
        </div>
      )}

      {/* 갤러리 */}
      <Gallery
        loading={loading}
        items={items}
        selectMode={selectMode}
        selected={selected}
        onToggleSelect={toggleSelect}
        onOpen={setActive}
      />

      {/* 센티넬 */}
      {(hasMore || loadingMore) && (
        <div ref={sentinelRef} className="lib-sentinel" aria-hidden>
          {loadingMore && <span className="spinner" />}
        </div>
      )}

      {/* 라이트박스 */}
      <Lightbox open={!!active} item={active} onClose={() => setActive(null)} />
    </div>
  );
}
