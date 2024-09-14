import React from "react";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";

interface GenerateButtonProps {
  onClick: () => void;
  isLoading: boolean;
  countdown: number | null;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  onClick,
  isLoading,
  countdown,
}) => {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="w-full"
      disabled={isLoading || countdown !== null}
    >
      {isLoading ? (
        <>
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : countdown !== null ? (
        `Retrying in ${countdown}s`
      ) : (
        "GENERATE"
      )}
    </Button>
  );
};
