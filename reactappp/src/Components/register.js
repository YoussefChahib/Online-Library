import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth, db } from "./firebase";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fname, setFname] = useState("");
    const [lname, setLname] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            const user = auth.currentUser;
            console.log(user);
            if (user) {
                await setDoc(doc(db, "Users", user.uid), {
                    email: user.email,
                    firstName: fname,
                    lastName: lname,
                    photo: ""
                });
            }
            console.log("User Registered Successfully!!");
            toast.success("User Registered Successfully!!", {
                position: "top-center",
            });
        } catch (error) {
            console.log(error.message);
            toast.error(error.message, {
                position: `bottom-center`
            });
        }
    };

    return (
        <div className="container-fluid d-flex justify-content-center align-items-center"
             style={{minHeight: "100vh", backgroundColor: "#f0f2f5", padding: "0"}}>
            <div className="card shadow-lg p-4"
                 style={{width: "100%", maxWidth: "400px", borderRadius: "20px", backgroundColor: "#ffffff"}}>
                <h3 className="text-center mb-4"
                    style={{color: "#4e73df", fontFamily: "Poppins, sans-serif", fontWeight: "600"}}>Sign Up</h3>
                <form onSubmit={handleRegister}>
                    <div className="mb-3">
                        <label htmlFor="fname" className="form-label" style={{fontWeight: "500"}}>First Name</label>
                        <input
                            type="text"
                            className="form-control"
                            id="fname"
                            placeholder="Enter first name"
                            value={fname}
                            onChange={(e) => setFname(e.target.value)}
                            required
                            style={{borderRadius: "8px", borderColor: "#ced4da", transition: "border 0.3s ease"}}
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="lname" className="form-label" style={{fontWeight: "500"}}>Last Name</label>
                        <input
                            type="text"
                            className="form-control"
                            id="lname"
                            placeholder="Enter last name"
                            value={lname}
                            onChange={(e) => setLname(e.target.value)}
                            required
                            style={{borderRadius: "8px", borderColor: "#ced4da", transition: "border 0.3s ease"}}
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="email" className="form-label" style={{fontWeight: "500"}}>Email Address</label>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            placeholder="Enter email"

                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{borderRadius: "8px", borderColor: "#ced4da", transition: "border 0.3s ease"}}
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="password" className="form-label" style={{fontWeight: "500"}}>Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{borderRadius: "8px", borderColor: "#ced4da", transition: "border 0.3s ease"}}
                        />
                    </div>

                    <div className="d-grid">
                        <button type="submit" className="btn btn-primary" style={{
                            padding: "10px",
                            borderRadius: "8px",
                            backgroundColor: "#4e73df",
                            borderColor: "#4e73df",
                            fontWeight: "600"
                        }}>
                            Sign Up
                        </button>
                    </div>

                    <div className="text-center mt-3">
                        <p className="text-muted" style={{fontSize: "14px"}}>Already registered? <a href="/login"
                                                                                                    className="text-primary">Login
                            here</a></p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Register;
