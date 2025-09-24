import { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useRoot } from '@/services/core/RootProvider.jsx'
import { GET, FileUpload, DELETE } from '@/services/network/Network.js';

export default function UserInfoModal({ show, onHide }) {
  const { access, DEFAULT_AVATAR, getFile, getUserNo, removeStorage } = useRoot()
  const [user, setUser] = useState({no: 0, name: "", email: ""})
  const [preview, setPreview] = useState(DEFAULT_AVATAR);
  const fileInputRef = useRef(null);
  const [isChecked, setIsChecked] = useState(true);
  const [isEdit, setIsEdit] = useState(false);

  const changeEvent = (e) => {
    const {name, value} = e.target
    setIsEdit(true)
    setUser({...user, [name]: value})
  }

  const imageChange = () => {
    const file = fileInputRef.current.files[0];
    setIsEdit(true)
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if(access) {
      GET("/oauth/user")
      .then(res => {
        if(res.status) {
          setUser(res.result)
          setPreview(getFile(res.result.fileNo))
        }
      })
    } else {
      onHide?.();
    }
  }, [access, show]);

  const openPicker = () => fileInputRef.current?.click();

  const onSave = () => {
    const formData = new FormData();
    if(fileInputRef.current.files.length > 0) {
      formData.append("file", fileInputRef.current.files[0]);
    }
    formData.append("name", user.name);
    FileUpload('/oauth/user', formData)
    .then(res => {
      if(res.status) {
        alert('회원 정보가 수정되었습니다.');
        setIsEdit(false)
        // onHide?.();
      } else {
        alert(res.message)
      }
    })
  };

  const onDelete = () => {
    if (confirm('정말 탈퇴하시겠습니까?')) {
      DELETE('/oauth/user')
      .then(res => {
        if(res.status) { 
          alert('회원이 탈퇴되었습니다.');
          logout();
        } else {
          alert(res.message)
        }
      })
    }
  };

  const logout = () => removeStorage("access")

  const checkEvent = (e) => {
    setIsChecked(!e.target.checked)
    if(!e.target.checked) {
      if(isEdit) {
        if (confirm('정말 수정하시겠습니까?')) {
          onSave()
        } else {
          e.target.checked = true
        }
      }
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" container={document.body}>
      <Modal.Header closeButton className="modal-head">
        <Modal.Title>회원 정보</Modal.Title>
      </Modal.Header>

      <Modal.Body className="modal-body">
        {/* 1행: 아바타(클릭 변경)  +  사용자 이름 */}
        <div className="userinfo-row">
          <button
            type="button"
            className="avatar-button"
            onClick={openPicker}
            aria-label="프로필 이미지 변경"
            disabled={isChecked}
          >
            <img
              className="avatar"
              alt="프로필 이미지"
              src={preview}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_AVATAR; }}
            />
          </button>

          <Form.Control
            name="name"
            value={user.name}
            onChange={changeEvent}
            minLength={2}
            placeholder="사용자 이름"
            readOnly={isChecked}
          />
        </div>

        {/* 숨겨진 파일 입력 (아바타 클릭 시 열림) */}
        <input
          ref={fileInputRef}
          name="file"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={imageChange}
        />

        {/* 2행: 이메일 (read-only) */}
        <Form.Group className="field" style={{ marginTop: 10 }}>
          <Form.Control type="email" value={user.email} readOnly placeholder="이메일" />
          <Form.Check type="switch" label="회원 정보 수정" reverse  onClick={checkEvent}/>
        </Form.Group>
      </Modal.Body>

      {/* 풋터: 닫기 / 회원정보수정 / 회원탈퇴 */}
      <Modal.Footer className="modal-actions">
        <Button className="btn btn-login" onClick={logout}>로그아웃</Button>
        {/* <Button className="btn btn-login" onClick={onSave}>회원 정보 수정</Button> */}
        <Button variant="outline-danger" onClick={onDelete}>회원 탈퇴</Button>
      </Modal.Footer>
    </Modal>
  );
}
