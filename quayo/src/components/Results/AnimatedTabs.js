import React, { useState, useEffect } from 'react';

const AnimatedTabs = ({ children, defaultValue }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  const [direction, setDirection] = useState('right');
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTabChange = (newValue) => {
    setDirection(newValue > activeTab ? 'right' : 'left');
    setActiveTab(newValue);
  };

  return (
    <div className="w-full">
      <style jsx="true">{`
        @keyframes slideRight {
          from { transform: translateX(-2%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideLeft {
          from { transform: translateX(2%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .tab-content {
          animation: ${direction === 'right' ? 'slideRight' : 'slideLeft'} 0.2s ease-out forwards;
        }
        
        /* Mobile tab styles */
        @media (max-width: 639px) {
          .tab-list {
            display: flex;
            white-space: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE and Edge */
            padding-bottom: 4px;
          }
          
          .tab-list::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        }
      `}</style>

      {/* Tab List */}
      <div className="border-b border-gray-200 mb-6">
        <div className={`flex ${isMobile ? 'tab-list' : 'flex-wrap'} -mb-px`}>
          {React.Children.map(children, (child) => {
            if (child?.type?.displayName === 'TabTrigger') {
              return React.cloneElement(child, {
                active: child.props.value === activeTab,
                onClick: () => handleTabChange(child.props.value),
                isMobile
              });
            }
            return null;
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="relative">
        {React.Children.map(children, (child) => {
          if (child?.type?.displayName === 'TabContent') {
            return child.props.value === activeTab ? (
              <div className="tab-content">
                {child.props.children}
              </div>
            ) : null;
          }
          return null;
        })}
      </div>
    </div>
  );
};

const TabTrigger = ({ children, active, onClick, isMobile }) => (
  <button
    onClick={onClick}
    className={`
      relative px-4 py-2 font-medium text-sm whitespace-nowrap
      ${active 
        ? 'text-blue-600 border-b-2 border-blue-600' 
        : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}
      transition-all duration-200
      ${isMobile ? 'flex-shrink-0' : ''}
    `}
  >
    {children}
  </button>
);

const TabContent = ({ children }) => (
  <div className="py-2">
    {children}
  </div>
);

// Set displayName for component recognition
TabTrigger.displayName = 'TabTrigger';
TabContent.displayName = 'TabContent';

export { AnimatedTabs, TabTrigger, TabContent };