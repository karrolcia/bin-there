import confetti from 'canvas-confetti';

export const celebrateBinning = () => {
  // Refined nature-inspired palette with muted greens
  const colors = ['#6B8E7A', '#7A9E89', '#8FAF99', '#A8BFA8', '#5D7A6B'];
  
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.8 },
    colors: colors,
    shapes: ['circle', 'square'],
    ticks: 150,
    gravity: 0.8,
    decay: 0.92,
    startVelocity: 25,
    scalar: 0.9,
    disableForReducedMotion: true,
  });
  
  // Second burst with slight delay for more organic feel
  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 100,
      origin: { y: 0.8 },
      colors: colors,
      shapes: ['circle', 'square'],
      ticks: 120,
      gravity: 0.7,
      startVelocity: 20,
      scalar: 0.8,
      disableForReducedMotion: true,
    });
  }, 150);
};
