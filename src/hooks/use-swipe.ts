import { useState, useRef, useCallback } from "react";

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  preventDefaultTouchmove?: boolean;
}

export const useSwipe = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  preventDefaultTouchmove = false,
}: UseSwipeOptions): SwipeHandlers => {
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    setIsSwiping(true);
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isSwiping) return;
      touchEndX.current = e.touches[0].clientX;
      
      if (preventDefaultTouchmove) {
        const diff = Math.abs(touchEndX.current - touchStartX.current);
        if (diff > 10) {
          e.preventDefault();
        }
      }
    },
    [isSwiping, preventDefaultTouchmove]
  );

  const onTouchEnd = useCallback(() => {
    if (!isSwiping) return;
    setIsSwiping(false);

    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swiped left (in RTL this means "next")
        onSwipeLeft?.();
      } else {
        // Swiped right (in RTL this means "prev")
        onSwipeRight?.();
      }
    }
  }, [isSwiping, threshold, onSwipeLeft, onSwipeRight]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};

export default useSwipe;
