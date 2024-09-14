import { useState, useCallback, useEffect } from 'react';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export function useRetry(onRetry: () => void) {
  const [retryCount, setRetryCount] = useState(0);
  const [retryDelay, setRetryDelay] = useState(INITIAL_RETRY_DELAY);
  const [countdown, setCountdown] = useState<number | null>(null);

  const retryFetch = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      const jitter = Math.random() * 1000;
      const nextDelay = Math.min(retryDelay * 2 + jitter, 60000); // Cap at 60 seconds
      setRetryDelay(nextDelay);
      setRetryCount((prevCount) => prevCount + 1);
      setCountdown(Math.ceil(nextDelay / 1000));
    } else {
      setCountdown(null);
    }
  }, [retryCount, retryDelay]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            onRetry();
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown, onRetry]);

  const reset = useCallback(() => {
    setRetryCount(0);
    setRetryDelay(INITIAL_RETRY_DELAY);
    setCountdown(null);
  }, []);

  return { retryCount, countdown, retryFetch, reset };
}