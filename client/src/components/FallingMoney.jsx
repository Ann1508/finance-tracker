import React, { useMemo } from 'react';

const items = ['💰', '🪙', '💵', '💴', '💶'];

export default function FallingMoney() {
  const elements = useMemo(() => {
    return Array.from({ length: 25 }).map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 18 + Math.random() * 12,
      size: 22 + Math.random() * 18,
      icon: items[Math.floor(Math.random() * items.length)],
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {elements.map((el, i) => (
        <span
          key={i}
          className="falling-money"
          style={{
            left: `${el.left}%`,
            animationDelay: `${el.delay}s`,
            animationDuration: `${el.duration}s`,
            fontSize: `${el.size}px`,
          }}
        >
          {el.icon}
        </span>
      ))}
    </div>
  );
}
