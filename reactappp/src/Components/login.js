import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock } from "@fortawesome/free-solid-svg-icons";
import { auth } from "./firebase";
import { toast } from "react-toastify";
import SignInWithGoogle from "./SignInWithGoogle";
import SignInWithFacebook from "./SignInWithFacebook";
import ForgotPassword from "./ForgotPassword";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleShow = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("User logged in successfully!", { position: "top-center" });
      window.location.href = "/UploadBooks";
    } catch (error) {
      toast.error(error.message, { position: "bottom-center" });
    }
  };

  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        backgroundColor: "#f7f9fc",
        padding: "0",
      }}
    >
      <div
        className="card shadow-lg p-4"
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "15px",
          backgroundColor: "#ffffff",
        }}
      >
        <h3
          className="text-center mb-4"
          style={{
            color: "#4e73df",
            fontFamily: "Poppins, sans-serif",
            fontWeight: "600",
          }}
        >
          <FontAwesomeIcon icon={faLock} className="me-2" />
          Smart Library
        </h3>
        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label" style={{ fontWeight: "500" }}>
              Email
            </label>
            <div className="input-group">
              <span className="input-group-text" style={{ borderRadius: "8px 0 0 8px" }}>
                <FontAwesomeIcon icon={faEnvelope} />
              </span>
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  borderRadius: "0 8px 8px 0",
                  borderColor: "#ced4da",
                  transition: "border 0.3s ease",
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label" style={{ fontWeight: "500" }}>
              Password
            </label>
            <div className="input-group">
              <span className="input-group-text" style={{ borderRadius: "8px 0 0 8px" }}>
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  borderRadius: "0 8px 8px 0",
                  borderColor: "#ced4da",
                  transition: "border 0.3s ease",
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="d-grid">
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: "10px",
                borderRadius: "8px",
                backgroundColor: "#4e73df",
                borderColor: "#4e73df",
                fontWeight: "600",
              }}
            >
              Login
            </button>
          </div>

          {/* Forgot Password */}
          <div className="text-center mt-3">
            <button
              onClick={handleShow}
              className="btn btn-link text-primary"
              style={{ fontSize: "14px", textDecoration: "none", fontWeight: "500" }}
            >
              Forgot Password?
            </button>
            <ForgotPassword show={showModal} handleClose={handleClose} />
          </div>

          {/* Divider */}
          <div className="text-center my-3">
            <span style={{ color: "#adb5bd", fontSize: "14px" }}>OR</span>
          </div>

          {/* Social Login */}
          <div className="text-center my-2">
            <SignInWithGoogle />
          </div>
          <div className="text-center my-2">
            <SignInWithFacebook />
          </div>

          {/* Register Link */}
          <div className="text-center mt-3">
            <p className="text-muted" style={{ fontSize: "14px" }}>
              New user?{" "}
              <a href="/register" className="text-primary" style={{ textDecoration: "none" }}>
                Register here
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
