import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { POST, PUT } from '@/services/network/Network.js';

export default function Signup(){
  const [user, setUser] = useState({type: 1, service: 3, name:'', email:''});
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email');
  const navigate = useNavigate();

  const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  const checkEvent = () => {
    if(step === "email") {
      return (!isValidEmail(user.email));
    } else if(step === "code") {
      return (!user.name); //(!user.name || code.length<=25)
    }
    return false
  }

  const changeEvent = (e) => {
    const {name, value} = e.target
    setUser({...user, [name]: value})
  }

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
  const onVerify = async () => {
    PUT("oauth/user", user)
    .then(res => {
      if(res.status) {
        alert(res.message)
        navigate("/")
      } else {
        alert(res.message)
      }
    })
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
    <main className="page-wrap">
      <section className="auth-card" aria-labelledby="signupTitle">
        <div className="auth-head">
          <h1 id="signupTitle">회원가입</h1>
          <p className="auth-sub">이름과 이메일을 입력하고 이메일 인증을 완료해주세요.</p>
        </div>

        <form onSubmit={submitEvent} autoComplete="on">
        <div className="auth-body">
            
            <div className="field">
              <label htmlFor="email">이메일</label>
              <input id="email" name="email" type="email" value={user.email} onChange={changeEvent} required disabled={step==='code'}/>
            </div>

            {step==='code' && <>
              <div className="field">
                <label htmlFor="name">사용자 이름</label>
                <input id="name" name="name" type="text" value={user.name} onChange={changeEvent} minLength={2} required/>
              </div>

              {/* <div id="codeBlock">
                <div className="field">
                  <label htmlFor="code">인증코드</label>
                  <input id="code" type="text" maxLength={32}
                         value={code} onChange={e=>setCode(e.target.value)}/>
                  <small className="help">메일로 받은 6자리 코드를 입력하세요.</small>
                </div>
              </div> */}
            </>
            }
        </div>

        <div className="auth-actions">
          <a className="btn btn-ghost" href="/">취소</a>
        </div>
      </form>
      </section>
    </main>
  );
}
