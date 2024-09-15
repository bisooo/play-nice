"use client";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateUserTopItems } from "@/hooks/useUpdateUserTopItems";
import { useDialogState } from "@/lib/dialogUtils";

const Profile: React.FC = () => {
  const { data: session } = useSession();
  const { isUpdating, updateUserTopItems } = useUpdateUserTopItems();
  const { dialogState, openDialog, closeDialog } = useDialogState();

  const handleUpdateUserTopItems = async () => {
    const result = await updateUserTopItems();
    openDialog(result.success ? "Success" : "Error", result.message);
  };

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
          <p className="mb-4 text-sm text-gray-400">
            TOKEN: {session.accessToken?.substring(0, 20)}...
          </p>
          <div className="space-y-4 w-full">
            <Button
              onClick={handleUpdateUserTopItems}
              disabled={isUpdating}
              className="w-full border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-colors duration-300"
              variant="outline"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  UPDATING...
                </>
              ) : (
                "UPDATE DATA"
              )}
            </Button>
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
      <Dialog open={dialogState.isOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState.title}</DialogTitle>
            <DialogDescription>{dialogState.description}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
