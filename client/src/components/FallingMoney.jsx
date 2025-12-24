import React from 'react';

const items = [
  '💰', '🪙', '💵', '💴', '💶'
];

export default function FallingMoney() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">

      {Array.from({ length: 25 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 10;
        const duration = 15 + Math.random() * 10;
        const size = 20 + Math.random() * 20;
        const icon = items[Math.floor(Math.random() * items.length)];

        return (
          <span
            key={i}
            className="falling-money"
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              fontSize: `${size}px`,
            }}
          >
            {icon}
          </span>
        );
      })}
    </div>
  );
}
