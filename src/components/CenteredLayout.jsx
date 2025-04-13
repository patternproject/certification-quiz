// CenteredLayout.jsx
import React from 'react';

const CenteredLayout = ({ children }) => {
  return (
    <div 
      style={{
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '0',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {children}
    </div>
  );
};

export default CenteredLayout;