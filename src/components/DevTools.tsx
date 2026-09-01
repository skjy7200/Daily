import React, { useState, useEffect } from 'react';

function DevTools() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const savedOffset = parseInt(localStorage.getItem('debug_day_offset') || '0', 10);
    setOffset(savedOffset);
  }, []);

  const handleNextDay = () => {
    const newOffset = offset + 1;
    localStorage.setItem('debug_day_offset', newOffset.toString());
    setOffset(newOffset);
    window.location.reload();
  };

  const handleReset = () => {
    localStorage.setItem('debug_day_offset', '0');
    setOffset(0);
    window.location.reload();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      fontSize: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#ffcb05' }}>🚧 DevTools</div>
      <div>Virtual Date: +{offset} Days</div>
      <button onClick={handleNextDay} style={{ cursor: 'pointer', padding: '4px', background: '#444', border: '1px solid #666', color:'white' }}>
        내일로 가기 (+1일)
      </button>
      <button onClick={handleReset} style={{ cursor: 'pointer', padding: '4px', background: '#800', border: '1px solid #a00', color:'white' }}>
        날짜 초기화
      </button>
    </div>
  );
}

export default DevTools;
