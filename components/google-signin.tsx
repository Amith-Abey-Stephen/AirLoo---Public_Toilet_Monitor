import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Globe } from "lucide-react";

type Props = {
  auth: ReturnType<typeof import("firebase/auth").getAuth> | null;
  onSuccess: (email: string) => void;
};

export function GoogleSignIn({ auth, onSuccess }: Props) {
  async function handleGoogleSignIn() {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const email = result.user.email;
    if (email) onSuccess(email);
  }

  return (
    <button className="ghost-button google-btn" type="button" onClick={handleGoogleSignIn}>
      <Globe size={18} />
      Continue with Google
    </button>
  );
}
