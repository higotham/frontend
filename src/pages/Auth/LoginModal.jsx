import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { POST } from '@/services/network/Network.js';
import { useRoot } from '@/services/core/RootProvider.jsx'

export default function LoginModal({ show, onHide }) {
  const navigate = useNavigate();
  const [user, setUser] = useState({type: 2, email:''});
  const [step, setStep] = useState("email"); // 'email' | 'code'
  const [code, setCode] = useState("");
  const { setStorage } = useRoot();

  const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  const changeEvent = (e) => {
    const {name, value} = e.target
    setUser({...user, [name]: value})
  }

  const checkEvent = () => {
    if(step === "email") {
      return (!isValidEmail(user.email))
    } else if(step === "code") {
      return (code.length<=24)
    }
    return false
  }

  const close = () => {
    // setStep("email");
    // setEmail("");
    // setCode("");
    // onHide?.();
    location.reload()
  };

  // ✅ 데모: 이메일 인증 버튼 -> 코드 입력 단계로 전환만
  const onRequest = async () => {
    POST("/oauth/user/email", user)
    .then(res => {
      if(res.status) {
        setStep('code');
      } else {
        alert(res.message)
        navigate("/")
      }
    })
  };

  // ✅ 데모: 인증코드 확인 버튼 -> 바로 /app 이동
  const onVerify = async () => {
    POST("/oauth/user", {code: code})
    .then(res => {
      if(res.status) {
        setStorage("access", res.result);
        location.reload()
      } else {
        alert(res.message)
      }
    })
    // 백엔드 붙일 때 사용:
    // await verifyEmailCode(email, code);
    // close();              // 모달 닫고
    // navigate("/app");     // index2 화면(= Dashboard)로 이동
  };

  const submitEvent = (e) => {
    e.preventDefault()
    if(step === "email") {
      onRequest()
    } else {
      onVerify()
    }
  }

  return (
    <Modal
      show={show}
      onHide={close}
      centered
      keyboard
      backdrop="static"
      container={document.body}
      restoreFocus
    >
      <Modal.Header closeButton className="modal-head">
        <Modal.Title>로그인</Modal.Title>
      </Modal.Header>

      <Form onSubmit={submitEvent}>
      <Modal.Body className="modal-body">
          <Form.Group className="field">
            <Form.Label>이메일</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={user.email}
              disabled={step === "code"}
              placeholder="you@example.com"
              onChange={changeEvent}
              required
            />
          </Form.Group>

          {step === "code" && (
            <Form.Group className="field">
              <Form.Label>인증코드</Form.Label>
              <Form.Control
                type="text"
                maxLength={32}
                value={code}
                placeholder="이메일로 받은 인증용 코드를 입력해 주세요."
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </Form.Group>
          )}
      </Modal.Body>

      <Modal.Footer className="modal-actions">
        <Button variant="light" className="btn btn-ghost" onClick={close}>
          닫기
        </Button>
        <Button type="submit" className="btn btn-login" disabled={checkEvent()}>
          {step === "email" ? "이메일 인증" : "인증코드 확인"}
        </Button>
      </Modal.Footer>
      </Form>
    </Modal>
  );
}
