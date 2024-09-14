"use client";

import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

const Login: React.FC = () => {
  const { data: session, status } = useSession();

  const handleLogin = () => {
    signIn("spotify");
  };

  if (status === "loading") {
    return <div className="h-10"></div>; // Placeholder height to prevent layout shift
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center py-4">
        <Button
          onClick={handleLogin}
          className="w-full max-w-xs bg-[#1DB954] hover:bg-[#1ed760] text-white py-3 rounded-full text-lg font-semibold"
        >
          LOGIN
        </Button>
      </div>
    );
  }

  // User is authenticated, return a separator
  return <div />;
};

export default Login;
