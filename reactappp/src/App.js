import React, { useEffect, useState } from "react";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,

  Route,
  Navigate,
} from "react-router-dom";

import Login from "./Components/login";
import SignUp from "./Components/register";
import ForgotPassword from "./Components/ForgotPassword";
import UploadBooks from "./Components/UploadBooks";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth } from "./Components/firebase";

function App() {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser); 
      } else {
        setUser(null); 
      }
      setLoading(false); 
    });

    
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading-screen">Chargement...</div>;
  }

  return (
    <Router>
      <div className="App">
        <div className="auth-wrapper">
          <div className="auth-inner">
            <Routes>
              <Route
                path="/"
                element={user ? <Navigate to="/UploadBooks" /> : <Navigate to="/login" />}
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<SignUp />} />
              <Route
                path="/UploadBooks"
                element={user ? <UploadBooks /> : <Navigate to="/login" />}
              />
              <Route path="/ForgotPassword" element={<ForgotPassword />} />
            </Routes>
            <ToastContainer />
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;