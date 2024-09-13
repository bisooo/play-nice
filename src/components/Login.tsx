"use client";

import { signIn, useSession } from "next-auth/react";

const Login: React.FC = () => {
  const { data: session } = useSession();
  if (!session) {
    return (
      <button className="white_btn mb-8" onClick={() => signIn()}>
        LOGIN
      </button>
    );
  }
};

export default Login;
