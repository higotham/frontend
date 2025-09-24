// ==========================================================
// 1) src/pages/Canvas.jsx  ★ 전체 교체 ★
//    - 결과 패널: variant="layer" 하나만 사용 (중복 렌더 제거)
//    - FAB 버튼으로 언제든 열고/닫기
//    - pageClass에 따라 stage가 살짝 축소되는 페이지 전환 느낌 유지
//    - 캔버스는 Stage 컴포넌트로 전체 화면 채움
// ==========================================================
import React from 'react';
import useCanvasPage from '@/pages/Canvas/hooks/useCanvasPage.js';
import {
  Stage, PromptDock, ResultPanel, ResultFab,
  LoadingIndicator, ModelPickerModal, AspectRatioModal,
} from '@/pages/Canvas/components';
import RadialMenu from '@/pages/Canvas/components/RadialMenu.jsx';
import DBModal from '@/pages/Canvas/components/DBModal.jsx';
import GuideOverlay from '@/pages/Canvas/components/GuideOverlay.jsx';

export default function Canvas() {
  const {
    pageClass,
    stageProps,
    isGenerating,
    promptProps,
    modelModalProps,
    aspectModalProps,
    resultProps,         
    radialProps,
    dbModalProps,
  } = useCanvasPage();

  const resultKey = resultProps?.url || 'empty';

  return (
    <div className={pageClass} data-result-open={resultProps.open ? 'true' : 'false'}>
      {/* 캔버스: 화면 꽉 채움 (CSS에서 .canvas-page/.stage 처리) */}
      <Stage {...stageProps} overlay={<GuideOverlay />} />

      {/* 오버레이/도크/모달 */}
      <LoadingIndicator visible={isGenerating} text="이미지 생성 중…" />
      <PromptDock {...promptProps} />
      <ModelPickerModal {...modelModalProps} />
      <AspectRatioModal {...aspectModalProps} />

      {/* 결과 패널: 레이어 전환 + ESC/스크림으로 닫기 */}
      <ResultPanel key={resultKey} variant="layer" {...resultProps} />

      {/* 언제든 열고 닫는 FAB */}
      <ResultFab open={resultProps.open} onOpenChange={resultProps.onOpenChange} />

      {/* 기타 */}
      <RadialMenu {...radialProps} />
      <DBModal {...dbModalProps} />
    </div>
  );
}