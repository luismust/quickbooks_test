"use client"

import { useEffect, useState } from 'react';

const icons = [
  '📝', '✏️', '📚', '🎯', '✅', // Exámenes
  '❌', '📊', '📋', '🎓', '📖', // Académicos
  '✍️', '📑', '📎', '🔍', '💡', // Estudio
  '📌', '📏', '✂️', '📐', '📎', // Útiles
  '🗂️', '📓', '📔', '📕', '📗', // Libros
  '📘', '📙', '📒', '📃', '📄', // Más libros
  '📰', '🗞️', '📜', '📋', '📅', // Documentos
  '⌛', '⏰', '🎓', '🏆', '🌟', // Tiempo y logros
  '💭', '💡', '💻', '⭐', '✨', // Pensamiento y tecnología
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
    className="absolute animate-float"
    style={{
      left: `${left}%`,
      animation: `float ${duration}s linear ${delay}s infinite`,
      fontSize: `${size}rem`,
      opacity: 0.7,
      filter: 'none',
      transform: 'translateY(100vh)',
      willChange: 'transform',
    }}
  >
    {icon}
  </div>
);

export const FloatingIcons = () => {
  const [iconElements, setIconElements] = useState<IconProps[]>([]);

  useEffect(() => {
    // Aumentar el número de iconos a 30
    const elements: IconProps[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      icon: icons[Math.floor(Math.random() * icons.length)],
      left: Math.random() * 100,
      delay: Math.random() * 10, // Reducir el delay máximo
      duration: 15 + Math.random() * 20, // Aumentar la duración para movimiento más lento
      size: 1.5 + Math.random() * 2, // Tamaños variables entre 1.5 y 3.5rem
    }));
    setIconElements(elements);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {iconElements.map((icon) => (
        <FloatingIcon key={icon.id} {...icon} />
      ))}
    </div>
  );
}; 