import React from 'react';
import './FloatingMenuButton.css';

/**
 * FloatingMenuButton - iOS Weather-inspired floating pill button
 * Fixed position in bottom-right corner with frosted glass effect
 */
const FloatingMenuButton = ({ onClick }) => {
  return (
    <button
      className="floating-menu-button"
      onClick={onClick}
      aria-label="Open locations menu"
    >
      <span className="hamburger-icon">&#x2630;</span>
    </button>
  );
};

export default FloatingMenuButton;
