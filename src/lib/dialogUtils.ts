import { useState } from 'react';

interface DialogState {
  isOpen: boolean;
  title: string;
  description: string;
}

export function useDialogState() {
  const [dialogState, setDialogState] = useState<DialogState>({ isOpen: false, title: '', description: '' });

  const openDialog = (title: string, description: string) => {
    setDialogState({ isOpen: true, title, description });
  };

  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  return { dialogState, openDialog, closeDialog };
}