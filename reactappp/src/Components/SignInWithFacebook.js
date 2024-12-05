import React, { useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { FaFacebook } from "react-icons/fa";
import { auth, facebookProvider, db } from "./firebase";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function SignInWithFacebook() {
    const [isSigningIn, setIsSigningIn] = useState(false);
    const navigate = useNavigate();

    async function handleFacebookLogin() {
        if (isSigningIn) return;
        setIsSigningIn(true);

        try {
            if (window.FB) {
                window.FB.logout();  
            }

            await signOut(auth);

    
            facebookProvider.setCustomParameters({
                auth_type: "reauthenticate",  
                display: "popup",             
            });

            const result = await signInWithPopup(auth, facebookProvider);
            const user = result.user;

            if (user) {

                await setDoc(doc(db, "Users", user.uid), {
                    email: user.email || "",
                    firstName: user.displayName || "",
                    photo: user.photoURL || "",
                });
                toast.success("Logged in with Facebook successfully!");
                navigate("/UploadBooks"); 
            }
        } catch (error) {
            toast.error(error.message, { position: "bottom-center" });
        } finally {
            setIsSigningIn(false);
        }
    }

    return (
        <div>
            <button
                className="btn w-100 d-flex align-items-center justify-content-center"
                onClick={handleFacebookLogin}
                disabled={isSigningIn}
                style={{
                    backgroundColor: "#3b5998",
                    color: "white",
                    borderRadius: "8px",
                    padding: "10px 15px",
                    fontWeight: "600",
                    border: "none",
                    transition: "background-color 0.3s ease, transform 0.2s ease",
                    fontSize: "16px"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#2d4373"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#3b5998"}
            >
                <FaFacebook size={20} className="me-2" />
                Continue with Facebook
            </button>
        </div>
    );
}

export default SignInWithFacebook;
