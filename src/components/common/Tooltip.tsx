import React, { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useTooltip } from '../../hooks/useTooltip';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: ReactNode;
  title?: string;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, title, className = '' }) => {
  const { isVisible, position, triggerRef, tooltipRef, showTooltip, hideTooltip } = useTooltip();
  const [isMobile, setIsMobile] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if mobile
    const isMobileDevice = window.innerWidth <= 768;
    setIsMobile(isMobileDevice);
    
    if (isMobileDevice) {
      if (isVisible) {
        hideTooltip();
      } else {
        showTooltip();
      }
    }
  };

  const tooltipContent = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed z-50 bg-white rounded-xl shadow-2xl border-2 border-blue-600 p-6 max-w-lg"
          style={{
            top: position.top,
            left: position.left,
            maxWidth: 'min(450px, 90vw)'
          }}
          onMouseLeave={hideTooltip}
        >
          {/* Arrow */}
          <div 
            className="absolute w-4 h-4 bg-white border-t-2 border-l-2 border-blue-600 transform rotate-45 -z-10"
            style={{
              top: position.top < window.innerHeight / 2 ? '-10px' : 'auto',
              bottom: position.top >= window.innerHeight / 2 ? '-10px' : 'auto',
              left: '50%',
              marginLeft: '-8px'
            }}
          />
          
          {title && (
            <div className="flex items-center gap-2 font-bold text-lg mb-3 text-blue-600 border-b-2 border-blue-100 pb-2">
              <InformationCircleIcon className="w-5 h-5" />
              {title}
            </div>
          )}
          
          <div className="text-gray-700 leading-relaxed">
            {content}
          </div>
          
          <div className="mt-4 pt-2 border-t border-gray-200 text-xs text-gray-500 italic">
            Mise à jour quotidienne à 6h00
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative inline-flex">
      <button
        ref={triggerRef}
        className={`w-6 h-6 rounded-full bg-blue-50 text-blue-600 border border-blue-600 flex items-center justify-center text-sm font-medium transition-all duration-200 hover:bg-blue-600 hover:text-white hover:scale-110 hover:shadow-lg ml-2 ${className}`}
        onMouseEnter={!isMobile ? showTooltip : undefined}
        onMouseLeave={!isMobile ? hideTooltip : undefined}
        onClick={handleClick}
      >
        <InformationCircleIcon className="w-4 h-4" />
      </button>
      
      {createPortal(tooltipContent, document.body)}
    </div>
  );
};