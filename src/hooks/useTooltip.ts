import { useState, useRef, useCallback, useEffect } from 'react';

interface Position {
  top: number;
  left: number;
}

export const useTooltip = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLElement>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    const tooltipWidth = tooltipRect.width || 450;
    const tooltipHeight = tooltipRect.height || 300;
    
    let left = triggerRect.left + (triggerRect.width / 2) - (tooltipWidth / 2);
    let top = triggerRect.bottom + 15;
    
    // Adjust if overflowing right
    if (left + tooltipWidth > window.innerWidth - 20) {
      left = window.innerWidth - tooltipWidth - 20;
    }
    
    // Adjust if overflowing left
    if (left < 20) {
      left = 20;
    }
    
    // Adjust if overflowing bottom
    if (top + tooltipHeight > window.innerHeight - 20) {
      top = triggerRect.top - tooltipHeight - 15;
      
      if (top < 20) {
        top = Math.max(20, window.innerHeight / 2 - tooltipHeight / 2);
      }
    }
    
    setPosition({ top, left });
  }, []);

  const showTooltip = useCallback(() => {
    setIsVisible(true);
    setTimeout(calculatePosition, 0);
  }, [calculatePosition]);

  const hideTooltip = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    if (isVisible) {
      const handleResize = () => calculatePosition();
      const handleScroll = () => calculatePosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isVisible, calculatePosition]);

  return {
    isVisible,
    position,
    triggerRef,
    tooltipRef,
    showTooltip,
    hideTooltip
  };
};