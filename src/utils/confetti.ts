import confetti from 'canvas-confetti';

export const celebrateBinning = () => {
  // Nature-inspired color palette
  const colors = ['#7BA57D', '#5D9B8C', '#A4C2A8', '#D4E4D7', '#F5E6CA'];
  
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.8 },
    colors: colors,
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
      ticks: 120,
      gravity: 0.7,
      startVelocity: 20,
      scalar: 0.8,
      disableForReducedMotion: true,
    });
  }, 150);
};
