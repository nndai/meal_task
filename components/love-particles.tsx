"use client";

import { motion } from "framer-motion";

const particles = [
  { icon: "❤", left: "7%", size: 30, duration: 16, delay: 0 },
  { icon: "✿", left: "17%", size: 34, duration: 19, delay: 2 },
  { icon: "❀", left: "28%", size: 38, duration: 15, delay: 1 },
  { icon: "❤", left: "40%", size: 32, duration: 18, delay: 3 },
  { icon: "✿", left: "56%", size: 36, duration: 20, delay: 0.5 },
  { icon: "❤", left: "68%", size: 30, duration: 14, delay: 2.5 },
  { icon: "❀", left: "79%", size: 40, duration: 21, delay: 4 },
  { icon: "❤", left: "90%", size: 34, duration: 17, delay: 1.5 },
  { icon: "💗", left: "82%", size: 38, duration: 19, delay: 3.5 },
  { icon: "💖", left: "35%", size: 36, duration: 16, delay: 2.2 },
  { icon: "🎈", left: "50%", size: 32, duration: 18, delay: 1.8 },
];

export function LoveParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((particle, index) => (
        <motion.span
          key={`${particle.icon}-${index}`}
          className="absolute -bottom-12 select-none text-pink-500/45"
          style={{ left: particle.left, fontSize: `${particle.size}px` }}
          initial={{ y: 0, x: 0, opacity: 0, rotate: -8, scale: 0.8 }}
          animate={{
            y: -900,
            x: [0, 14, -12, 10],
            opacity: [0, 0.45, 0.8, 0],
            rotate: [-8, 6, -4, 12],
            scale: [0.8, 1, 1.1, 1.2],
          }}
          transition={{
            duration: particle.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
            delay: particle.delay,
            times: [0, 0.12, 0.7, 1],
          }}
        >
          {particle.icon}
        </motion.span>
      ))}
    </div>
  );
}
