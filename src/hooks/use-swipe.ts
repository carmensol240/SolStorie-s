import { useState, useRef, useCallback } from "react";

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  swipeOffset: number;
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
  const [swipeOffset, setSwipeOffset] = useState(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    setIsSwiping(true);
    setSwipeOffset(0);
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isSwiping) return;
      const currentX = e.touches[0].clientX;
      const diff = currentX - touchStartX.current;
      
      // Apply visual offset during swipe (clamped for smooth feedback)
      const clampedOffset = Math.max(-100, Math.min(100, diff * 0.3));
      setSwipeOffset(clampedOffset);
      
      touchEndX.current = currentX;
      
      if (preventDefaultTouchmove) {
        const absDiff = Math.abs(diff);
        if (absDiff > 10) {
          e.preventDefault();
        }
      }
    },
    [isSwiping, preventDefaultTouchmove]
  );

  const onTouchEnd = useCallback(() => {
    if (!isSwiping) return;
    setIsSwiping(false);
    setSwipeOffset(0); // Reset visual offset with smooth transition

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
    swipeOffset,
  };
};

export default useSwipe;
