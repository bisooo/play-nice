"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export const login = () => signIn("spotify");

// Green login button; also shown when a signed-in session can no longer refresh its Spotify token
const Login = () => {
  const { data: session, status } = useSession();
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    // NextAuth sends failed or cancelled sign-ins back to "/" with ?error=... (pages.error in authOptions)
    if (!new URLSearchParams(window.location.search).has("error")) return;
    setLoginError("Couldn't log in with Spotify. Try again.");
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const expired = session?.error === "RefreshAccessTokenError";
  if (session && !expired) return null;

  return (
    <div className="flex flex-col items-center gap-2 pt-4">
      {(loginError || expired) && (
        <p role="alert" className="text-sm text-white/80 text-center">
          {expired ? "Your Spotify session expired. Log in again." : loginError}
        </p>
      )}
      <Button
        onClick={login}
        // Solid green at rest; hover and press switch to the green outline. Black text keeps AA contrast on green.
        className="min-w-[10rem] border-2 border-green-500 bg-green-500 text-black font-semibold hover:bg-transparent hover:text-green-500 active:bg-transparent active:text-green-500 transition-colors duration-300"
        variant="outline"
      >
        LOGIN
      </Button>
    </div>
  );
};

export default Login;
