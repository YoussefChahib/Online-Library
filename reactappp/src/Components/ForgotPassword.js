import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase'; 

const ForgotPassword = ({ show, handleClose }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleEmailChange = (e) => setEmail(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Un lien de réinitialisation a été envoyé à votre adresse e-mail.");
    } catch (err) {
      console.log(err)
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Réinitialiser le mot de passe</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formEmail">
            <Form.Label>Adresse e-mail</Form.Label>
            <Form.Control
              type="email"
              placeholder="Entrez votre e-mail"
              value={email}
              onChange={handleEmailChange}
              required
            />
          </Form.Group>
          <Button className="mt-3" variant="primary" type="button" onClick={handleSubmit} block>
  Envoyer le lien
</Button>

        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ForgotPassword;