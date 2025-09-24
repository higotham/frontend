// src/components/Canvas/AspectRatioModal.jsx
import React from 'react';
import { Modal, ListGroup, Button, Badge } from 'react-bootstrap';

export default function AspectRatioModal({ show, onHide, value, onSelect, options = [] }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header>
        <Modal.Title>이미지 비율</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <ListGroup>
          {options.map(opt => {
            const active = opt.value === value;
            return (
              <ListGroup.Item
                key={opt.value}
                action
                active={active}
                onClick={() => onSelect?.(opt.value)}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div className="fw-semibold">{opt.label}</div>
                  {active && <Badge bg="success">선택됨</Badge>}
                </div>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </Modal.Body>
    </Modal>
  );
}
