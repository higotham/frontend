// src/components/Canvas/KSamplerControl.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Form, Row, Col, Button } from 'react-bootstrap';

export default function KSamplerControl({
  sampler,                 // (선택) controlled 값
  onSamplerChange,         // (선택) 변경 콜백
  buttonLabel = 'K-Sampler',
  className = '',
  buttonClassName = 'dock-btn dock-btn--ghost', // 도크 버튼 룩 유지
}) {
  const isControlled = !!sampler;

  // ─ state
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);

  const [seed, setSeed] = useState(1);
  const [controlAfterGenerate, setControlAfterGenerate] = useState('randomize'); // 'randomize' | 'fixed'
  const [step, setStep] = useState(20);
  const [cfg, setCFG] = useState(7);
  const [samplerName, setSamplerName] = useState('euler');     // 'euler' | 'dpmpp_sde' | 'dpmpp_2m'
  const [scheduler, setScheduler] = useState('simple');        // 'simple' | 'normal' | 'karras'
  const [denoise, setDenoise] = useState(1.0);                 // 0.3 ~ 1.0

  // controlled 동기화
  useEffect(() => {
    if (!isControlled || !sampler) return;
    if (typeof sampler.seed === 'number') setSeed(sampler.seed);
    if (sampler.controlAfterGenerate) setControlAfterGenerate(sampler.controlAfterGenerate);
    if (typeof sampler.step === 'number') setStep(sampler.step);
    if (typeof sampler.cfg === 'number') setCFG(sampler.cfg);
    if (sampler.samplerName) setSamplerName(sampler.samplerName);
    if (sampler.scheduler) setScheduler(sampler.scheduler);
    if (typeof sampler.denoise === 'number') setDenoise(sampler.denoise);
  }, [isControlled, sampler]);

  // 상위 통지
  const emit = useCallback((next) => {
    onSamplerChange?.({
      seed: next?.seed ?? seed,
      controlAfterGenerate: next?.controlAfterGenerate ?? controlAfterGenerate,
      step: next?.step ?? step,
      cfg: next?.cfg ?? cfg,
      samplerName: next?.samplerName ?? samplerName,
      scheduler: next?.scheduler ?? scheduler,
      denoise: next?.denoise ?? denoise,
    });
  }, [onSamplerChange, seed, controlAfterGenerate, step, cfg, samplerName, scheduler, denoise]);

  function onlyTwoDecimalKeys(e) {
  const el = e.currentTarget;
  const k = e.key;

  // 내비게이션 키/기본 단축키 허용
  const allow = new Set(['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','Home','End']);
  if (allow.has(k)) return;
  if ((e.ctrlKey || e.metaKey) && ['a','c','v','x'].includes(k.toLowerCase())) return;

  // 과학표기/부호/쉼표 차단
  if (['e','E','+','-'].includes(k) || k === ',') { e.preventDefault(); return; }

  // 소수점: 하나만 허용
  if (k === '.') {
    if (el.value.includes('.')) e.preventDefault();
    return;
  }

  // 숫자: 소수점 뒤는 2자리까지만
  if (k >= '0' && k <= '9') {
    const { value, selectionStart, selectionEnd } = el;
    const dot = value.indexOf('.');
    if (dot >= 0 && selectionStart > dot) {
      const after = value.length - dot - 1;
      const replacing = (selectionEnd - selectionStart);
      if (after - replacing >= 2) e.preventDefault(); // 세 번째 자리 입력 차단
    }
    return;
  }

  // 그 외(한글/영문 등) 차단
  e.preventDefault();
  }

  function onlyTwoDecimalPaste(e) {
    const el = e.currentTarget;
    const text = (e.clipboardData || window.clipboardData).getData('text');
    const { value, selectionStart, selectionEnd } = el;
    const next = value.slice(0, selectionStart) + text + value.slice(selectionEnd);
    // 정규식: 숫자들 + (선택적) '.' + 소수 0~2자리
    if (!/^\d*\.?\d{0,2}$/.test(next)) e.preventDefault();
  }
  // 유효성+변경
  const up = {
    seed: (v) => {
      const n = Math.max(1, Math.min(999999999, Number(v) || 1));
      if (!isControlled) setSeed(n);
      emit({ seed: n });
    },
    control: (v) => {
      if (!isControlled) {
        if (v === 'randomize') setSeed(1);
        setControlAfterGenerate(v);
      } else if (v === 'randomize') {
        emit({ controlAfterGenerate: v, seed: 1 });
        return;
      }
      emit({ controlAfterGenerate: v });
    },
    step: (v) => {
      const n = Math.max(0, Math.min(30, Number(v) || 0));
      if (!isControlled) setStep(n);
      emit({ step: n });
    },
    cfg: (v) => {
      const n = Math.max(0, Math.min(20, Number(v) || 0));
      if (!isControlled) setCFG(n);
      emit({ cfg: n });
    },
    sampler: (v) => { if (!isControlled) setSamplerName(v); emit({ samplerName: v }); },
    scheduler: (v) => { if (!isControlled) setScheduler(v); emit({ scheduler: v }); },
    denoise: (v) => {
      const n = Math.max(0.3, Math.min(1.0, parseFloat(v) || 0.0));
      if (!isControlled) setDenoise(n);
      emit({ denoise: n });
    },
  };

  const cur = useMemo(() => ({
    seed, controlAfterGenerate, step, cfg, samplerName, scheduler, denoise
  }), [seed, controlAfterGenerate, step, cfg, samplerName, scheduler, denoise]);

  // ─ render
  return (
    <div className={`ksamp-wrap ${className}`}>
      {/* 트리거 버튼: 도크 버튼 룩 그대로 */}
      <button
        ref={btnRef}
        type="button"
        className={buttonClassName}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        title="K-Sampler 설정"
      >
      <strong>상세옵션 설정</strong>
      <span aria-hidden="true">🧪</span>
      </button>

      {/* react-bootstrap Modal: ModelPicker/AspectRatio와 동일 모션(페이드) */}
      <Modal
        show={open}
        onHide={() => setOpen(false)}
        centered
        size="lg"
        animation       // 기본 fade
        keyboard        // ESC 닫힘
        scrollable
      >
        <Modal.Header>
          <Modal.Title className="fw-bold">ai 디테일 설정</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group as={Row} className="mb-2" controlId="ks-seed">
              <Form.Label column sm={5}>Seed <small className="text-muted">(Fixed일 때 시드를 고정)</small></Form.Label>
              <Col sm={7}>
                <Form.Control
                  size="sm" type="number" min={1} max={999999999}
                  value={cur.seed}
                  onChange={(e)=> up.seed(e.target.value)}
                  disabled={cur.controlAfterGenerate !== 'fixed'}
                />
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-2" controlId="ks-control">
              <Form.Label column sm={5}>Control after generate <small className="text-muted">(생성 후 제어)</small></Form.Label>
              <Col sm={7}>
                <Form.Select size="sm" value={cur.controlAfterGenerate} onChange={(e)=> up.control(e.target.value)}>
                  <option value="randomize">Randomize — 생성 후 시드 랜덤</option>
                  <option value="fixed">Fixed — 시드 고정</option>
                </Form.Select>
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-2" controlId="ks-step">
              <Form.Label column sm={5}>Step <small className="text-muted">(샘플링 스텝 수)</small></Form.Label>
              <Col sm={7}>
                <Form.Control size="sm" type="number" min={1} max={30} value={cur.step} onChange={(e)=> up.step(e.target.value)} />
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-2" controlId="ks-cfg">
              <Form.Label column sm={5}>CFG <small className="text-muted">(프롬프트 반영 강도)</small></Form.Label>
              <Col sm={7}>
                <Form.Control size="sm" type="number" min={1} max={20} value={cur.cfg} onChange={(e)=> up.cfg(e.target.value)} />
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-2" controlId="ks-sampler">
              <Form.Label column sm={5}>Sampler <small className="text-muted">(알고리즘)</small></Form.Label>
              <Col sm={7}>
                <Form.Select size="sm" value={cur.samplerName} onChange={(e)=> up.sampler(e.target.value)}>
                  <option value="euler">Euler — 빠르고 균형형</option>
                  <option value="dpmpp_sde">DPM++ SDE — 안정·디테일</option>
                  <option value="dpmpp_2m">DPM++ 2M — 속도/품질 밸런스</option>
                </Form.Select>
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-2" controlId="ks-scheduler">
              <Form.Label column sm={5}>Scheduler <small className="text-muted">(노이즈 감쇠 곡선)</small></Form.Label>
              <Col sm={7}>
                <Form.Select size="sm" value={cur.scheduler} onChange={(e)=> up.scheduler(e.target.value)}>
                  <option value="simple">Simple — 기본 분배</option>
                  <option value="normal">Normal — 균형 분배</option>
                  <option value="karras">Karras — 고스텝/고해상도</option>
                </Form.Select>
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-1" controlId="ks-denoise">
              <Form.Label column sm={5}>
                Denoise <small className="text-muted">(0.3–1.0, 0.01 단위)</small>
              </Form.Label>
              <Col sm={7}>
                <Form.Control
                  size="sm"
                  type="number"
                  inputMode="decimal"
                  min={0.3}
                  max={1}
                  step={0.01}
                  defaultValue={cur.denoise}                                 
                  onKeyDown={onlyTwoDecimalKeys}      
                  onPaste={onlyTwoDecimalPaste}    
                  onChange={(e) => up.denoise(e.currentTarget.valueAsNumber)} 
                />
              </Col>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button className="dock-btn" style={{ background: 'var(--orange)', color: '#fff', borderColor: 'transparent' }} onClick={()=> setOpen(false)}>적용</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
