import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorAlertProps {
  message: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};
