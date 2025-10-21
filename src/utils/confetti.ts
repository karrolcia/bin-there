import confetti from 'canvas-confetti';

export const celebrateBinning = () => {
  // Earthy tones color palette
  const colors = ['#8B7355', '#6B8E6F', '#C4A572', '#A68B5B', '#7FA881'];
  
  // Add paw print and leaf shapes
  const pawPrint = confetti.shapeFromText({ text: '🐾', scalar: 2 });
  const leaf = confetti.shapeFromText({ text: '🌱', scalar: 2 });
  
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.8 },
    colors: colors,
    shapes: [pawPrint, leaf, 'circle'],
    ticks: 150,
    gravity: 0.8,
    decay: 0.92,
    startVelocity: 25,
    scalar: 0.9,
    disableForReducedMotion: true,
  });
  
  // Second burst with slight delay for more organic feel
  setTimeout(() => {
    const pawPrint = confetti.shapeFromText({ text: '🐾', scalar: 2 });
    const leaf = confetti.shapeFromText({ text: '🌱', scalar: 2 });
    
    confetti({
      particleCount: 40,
      spread: 100,
      origin: { y: 0.8 },
      colors: colors,
      shapes: [pawPrint, leaf, 'circle'],
      ticks: 120,
      gravity: 0.7,
      startVelocity: 20,
      scalar: 0.8,
      disableForReducedMotion: true,
    });
  }, 150);
};
