'use client';
import { useEffect, useState } from 'react';

const icons = [
  '📝', '✏️', '📚', '✅', '❌', '📋', '🎯', '💡', // Test related
  '📊', '📈', '🎓', '🏆', '📌', '✨', '⭐', // Achievement related
  '❓', '❗', '✍️', '📖', '🔍', '📱', '💻', '⚡', // Study related
  '🎉', '🌟', '🏅', '💪', '🎨', '🔆', '📢' // Motivation related
];

interface IconProps {
  id: number;
  icon: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

const FloatingIcon = ({ icon, left, delay, duration, size }: IconProps) => (
  <div
    className="fixed animate-float"
    style={{
      left: `${left}%`,
      bottom: '-50px',
      animation: `float ${duration}s linear ${delay}s infinite`,
      fontSize: `${size}rem`,
      willChange: 'transform',
      zIndex: 0,
      opacity: 0,
      filter: 'opacity(0.9)',
    }}
  >
    {icon}
  </div>
);

const FloatingIcons = () => {
  const [iconElements, setIconElements] = useState<IconProps[]>([]);

  useEffect(() => {
    const elements: IconProps[] = Array.from({ length: 40 }, (_, i) => {
      const isLarge = Math.random() < 0.25;
      return {
        id: i,
        icon: icons[Math.floor(Math.random() * icons.length)],
        left: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 10 + Math.random() * 6,
        size: isLarge ? 3.5 + Math.random() : 1.5 + Math.random(),
      };
    });
    setIconElements(elements);
  }, []);

  return (
    <div 
      className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none" 
      style={{ 
        zIndex: 0,
        background: 'transparent'
      }}
    >
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(110vh);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
            transform: translateY(90vh);
          }
          90% {
            opacity: 0.9;
            transform: translateY(-110vh);
          }
          100% {
            transform: translateY(-120vh);
            opacity: 0;
          }
        }
      `}</style>
      {iconElements.map((icon) => (
        <FloatingIcon key={icon.id} {...icon} />
      ))}
    </div>
  );
};

export default FloatingIcons; 