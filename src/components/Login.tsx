"use client";

import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const Login = () => {
  const { data: session, status } = useSession();

  const handleLogin = () => {
    signIn("spotify");
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center py-4">
        <Button
          onClick={handleLogin}
          className="w-full border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-colors duration-300"
          variant="outline"
        >
          LOGIN
        </Button>
      </div>
    );
  }

  // User is authenticated
  return null;
};

export default Login;
