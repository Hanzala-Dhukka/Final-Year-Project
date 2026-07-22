/**
 * particles.js
 * Deterministic particle generator for the floating-security-particles layer.
 * Positions/sizes are precomputed (no per-frame layout thrash) so the layer
 * stays at 60fps — each particle only animates transform/opacity.
 */
export function generateParticles(count = 18) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const size = 2 + Math.round(Math.random() * 4); // 2–6px
    const top = Math.random() * 100; // vh %
    const left = Math.random() * 100; // vw %
    const delay = Math.random() * 6; // s
    const duration = 9 + Math.random() * 8; // 9–17s
    const drift = 20 + Math.random() * 40; // px float distance
    particles.push({ id: i, size, top, left, delay, duration, drift });
  }
  return particles;
}
