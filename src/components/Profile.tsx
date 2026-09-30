"use client";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const Profile: React.FC = () => {
  const { data: session } = useSession();

  return (
    <div className="flex items-center justify-center bg-black text-white pt-32">
      {!session ? (
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold mb-4">USER NOT LOGGED IN</h1>
          <Image
            src="/placeholder.jpg"
            alt="LOGO"
            width={150}
            height={150}
            className="rounded-full object-cover mb-4"
            unoptimized={true}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold mb-4">
            AYO, {session.id?.toUpperCase()}
          </h1>
          <div className="space-y-4 w-full">
            <Button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-300"
              variant="outline"
            >
              LOG OUT
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
