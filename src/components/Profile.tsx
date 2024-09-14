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

  if (!session) {
    return (
      <div className="flex flex-col items-center text-center justify-between">
        <h1 className="text-2xl font-bold mb-4">USER NOT LOGGED IN</h1>
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
    <div className="flex flex-col items-center text-center justify-between">
      <h1 className="text-2xl font-bold mb-4">
        AYO, {session.id?.toUpperCase()}
      </h1>
      <p className="mb-4 text-sm text-gray-600">
        TOKEN: {session.accessToken?.substring(0, 20)}...
      </p>
      <div className="space-y-4 w-full max-w-xs">
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
            "UPDATE"
          )}
        </Button>
        <Button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-300"
          variant="outline"
        >
          LOGOUT
        </Button>
      </div>
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
