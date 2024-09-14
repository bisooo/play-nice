"use client";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Image from "next/image";

const Profile: React.FC = () => {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="flex flex-col flex-center text-center justify-between">
        <h1>USER NOT LOGGED IN</h1>
        <Image
          src="/placeholder.jpg"
          alt="LOGO"
          width={300}
          height={300}
          className="rounded-full object-cover"
          unoptimized={true}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-center text-center justify-between">
      <h1>AYO, {session.id?.toUpperCase()}</h1>
      <p>TOKEN: {session.accessToken}</p>
      <button
        className="white_btn mt-8"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        LOG OUT
      </button>
    </div>
  );
};

export default Profile;
