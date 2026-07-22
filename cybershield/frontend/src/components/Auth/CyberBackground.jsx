import { useMemo } from "react";
import { motion } from "framer-motion";
import { glowVariants } from "../../animations/cyberBackground";
import { generateParticles } from "../../animations/particles";

/**
 * CyberBackground — animated cyber grid + soft glows + floating particles.
 * Purely decorative (aria-hidden); sits behind the login content.
 */
export default function CyberBackground() {
  const particles = useMemo(() => generateParticles(20), []);

  return (
    <div className="cyber-background" aria-hidden="true">
      <div className="grid-layer" />

      <motion.div className="glow glow-one" custom={0} variants={glowVariants} animate="animate" />
      <motion.div className="glow glow-two" custom={1} variants={glowVariants} animate="animate" />

      <div className="particles-layer">
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="particle"
            style={{ width: p.size, height: p.size, top: `${p.top}%`, left: `${p.left}%` }}
            animate={{ y: [0, -p.drift, 0], opacity: [0.15, 0.6, 0.15] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}
