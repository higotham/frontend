// src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoot } from '@/services/core/RootProvider.jsx';
import { getLastDraftId, getDraftById, getLastDraft } from '@/services/data/drawings.js';

export default function Home(){
  const { access, tab } = useRoot();
  const navigate = useNavigate();

  const goCanvas = () => navigate('/canvas');
  const goLibrary = () => navigate('/library');
  const goStoryboards = () => navigate('/storyboards');

  // ✅ 최근 드로잉 열기: id 검증 → 복구 스캔 → Canvas에 위임
  const openLastDraft = async () => {
    try {
      let id = getLastDraftId();

      if (id) {
        const doc = await getDraftById(id);
        if (doc?.id) {
          navigate(`/canvas?draft=${encodeURIComponent(doc.id)}`);
          return;
        }
      }

      // id가 없거나 깨졌을 때: 저장소에서 최신 항목 스캔
      const recent = await getLastDraft();
      if (recent?.id) {
        navigate(`/canvas?draft=${encodeURIComponent(recent.id)}`);
        return;
      }

      // 최후 fallback: Canvas가 'last' 처리 로직으로 대응
      navigate('/canvas?draft=last');
    } catch {
      navigate('/canvas?draft=last');
    }
  };

  return (
    <main className="hero">
      <figure className="cover-wrap">
        <img
          className="cover-img"
          src="https://m.health.chosun.com/site/data/img_dir/2024/02/29/2024022901209_0.jpg"
          alt="주황빛 오렌지 커버"
        />
        <h1 className="hero-title">
          {access ? '환영합니다! 작업을 시작해볼까요?' : '그림을 그려서 이미지와 스토리보드로 만들어봐요! Orange'}
        </h1>

        {access && (
          <>
            {/* 하단 대시보드 */}
            <section className="content on-hero">
              {tab === 'drawing' ? (
                <section id="tab-drawing" className="panel" role="tabpanel" aria-labelledby="btn-drawing">
                  {/* ✅ 정확 3등분 */}
                  <div className="grid dash-grid equal-3">
                    <button
                      type="button"
                      className="dash-tile tile-button"
                      onClick={goCanvas}
                      aria-label="새 캔버스 시작 열기"
                    >
                      <div className="tile-body">
                        <div className="tile-kicker">START</div>
                        <h4 className="tile-title">새 캔버스 시작</h4>
                        <p className="tile-desc">러프 스케치, 라인아트, 브러시 테스트 등 바로 시작하세요.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="dash-tile tile-button"
                      onClick={openLastDraft}
                      aria-label="최근 드로잉 열기"
                    >
                      <div className="tile-body">
                        <div className="tile-kicker">RECENT</div>
                        <h4 className="tile-title">최근 드로잉</h4>
                        <p className="tile-desc">최근 작업을 이어서 진행할 수 있어요.</p>
                      </div>
                    </button>
                  </div>
                </section>
              ) : (
                <section id="tab-library" className="panel" role="tabpanel" aria-labelledby="btn-library">
                  <div className="grid dash-grid equal-3">
                    <button
                      type="button"
                      className="dash-tile tile-button"
                      onClick={goLibrary}
                      aria-label="이미지 갤러리 열기"
                    >
                      <div className="tile-body">
                        <div className="tile-kicker">GALLERY</div>
                        <h4 className="tile-title">이미지 갤러리</h4>
                        <p className="tile-desc">완성작/레퍼런스/임시 저장물 모아보기.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="dash-tile tile-button"
                      onClick={goStoryboards}
                      aria-label="프로젝트 관리 열기"
                    >
                      <div className="tile-body">
                        <div className="tile-kicker">STORY BOARD</div>
                        <h4 className="tile-title">스토리 보드</h4>
                        <p className="tile-desc">씬/샷/태그로 작품을 체계적으로.</p>
                      </div>
                    </button>
                  </div>
                </section>
              )}
            </section>
          </>
        )}
      </figure>

      <footer>© {new Date().getFullYear()} Orange </footer>
    </main>
  );
}
