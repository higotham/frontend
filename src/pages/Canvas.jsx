// src/pages/Canvas.jsx
import React, { useState, useEffect } from 'react';
import GuideOverlay from './Canvas/components/GuideOverlay.jsx';
import ResultPanel from './Canvas/components/ResultPanel.jsx';

export default function Canvas() {
  const [open, setOpen] = useState(false);

  useEffect(() => { document.title = "Canvas – Day2"; }, []);

  return (
    <div className="canvas-page" style={{ padding:'24px' }}>
      <h1 style={{ marginBottom:12 }}>Canvas</h1>
      <div className="stage" style={{ position:'relative', height:'60vh', border:'1px dashed #ccc', borderRadius:12 }}>
        
        <GuideOverlay show />
      </div>
      <div style={{ marginTop:12, display:'flex', gap:8 }}>
        <button className="btn-orange" onClick={() => setOpen(true)}>결과 보기</button>
      </div>

      <ResultPanel variant="layer" open={open} onOpenChange={setOpen} onClose={() => {}} url="" />
    </div>
  );
}
