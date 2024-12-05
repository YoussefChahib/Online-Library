import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { toast } from "react-toastify";
import { setDoc, doc } from "firebase/firestore";
import { FaGoogle } from "react-icons/fa"; 

function SignInwithGoogle() {
    async function googleLogin() {
        try {
            await signOut(auth);

            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: "select_account",
            });

            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            if (user) {
                await setDoc(doc(db, "Users", user.uid), {
                    email: user.email,
                    firstName: user.displayName,
                    photo: user.photoURL,
                    lastName: "",
                });
                toast.success("User logged in Successfully", {
                    position: "top-center",
                });
                window.location.href = "/UploadBooks";
            }
        } catch (error) {
            console.error("Error during Google login:", error.message);
            toast.error(error.message, {
                position: "bottom-center",
            });
        }
    }

    return (
        <div>
            <p className="continue-p">--Or continue with--</p>
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    backgroundColor: "#4285F4", 
                    padding: "12px 30px",
                    borderRadius: "30px",  
                    width: "100%",
                    maxWidth: "300px",  
                    margin: "15px auto", 
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    transition: "all 0.3s ease", 
                }}
                onClick={googleLogin}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
            >
                <FaGoogle
                    size={20}
                    style={{
                        marginRight: "12px", 
                        color: "white",
                    }}
                />
                <span
                    style={{
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "16px",
                    }}
                >
                    Sign in with Google
                </span>
            </div>
        </div>
    );
}

export default SignInwithGoogle;
