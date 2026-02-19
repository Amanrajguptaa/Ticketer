import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface AppIntroProps {
    onComplete: () => void;
}

export const AppIntro = ({ onComplete }: AppIntroProps) => {
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        if (shouldReduceMotion) {
            onComplete();
            return;
        }

        const timer = setTimeout(() => {
            onComplete();
        }, 3500); // Slightly longer for more weight

        return () => clearTimeout(timer);
    }, [onComplete, shouldReduceMotion]);

    // Texture dots (digital dust)
    const dots = useMemo(() => {
        return Array.from({ length: 24 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            size: Math.random() * 2 + 1,
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 2,
        }));
    }, []);

    if (shouldReduceMotion) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-tc-bg overflow-hidden">
            {/* 1. Background Grid - Simplified opacity */}
            <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(to right, #C8E64A 1px, transparent 1px), linear-gradient(to bottom, #C8E64A 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                }}
            />

            {/* 2. Optimized Noise Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* 3. Shifting Ambient Glows - Reduced blur for performance */}
            <motion.div
                className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-tc-lime/5 blur-[80px] pointer-events-none"
                animate={{
                    x: [0, 20, 0],
                    y: [0, -15, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute -top-40 -right-40 w-[300px] h-[300px] rounded-full bg-tc-teal/5 blur-[60px] pointer-events-none"
                animate={{
                    x: [0, -15, 0],
                    y: [0, 20, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* 4. Digital Dust - Reduced count for optimization */}
            {dots.slice(0, 12).map((dot) => (
                <motion.div
                    key={dot.id}
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: [0, 0.1, 0],
                        y: [0, -10, 0],
                    }}
                    transition={{
                        duration: dot.duration,
                        repeat: Infinity,
                        delay: dot.delay,
                        ease: "easeInOut"
                    }}
                    className="absolute bg-tc-lime rounded-full"
                    style={{
                        left: dot.left,
                        top: dot.top,
                        width: 1,
                        height: 1
                    }}
                />
            ))}

            {/* 5. Scanlines - Optimized CSS */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] z-10" />

            <AnimatePresence>
                <motion.div
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={{
                        animate: {
                            transition: {
                                staggerChildren: 0.1,
                            },
                        },
                        exit: {
                            opacity: 0,
                            y: -10,
                            filter: "blur(8px)",
                            transition: { duration: 0.4, ease: 'easeIn', delay: 2.8 },
                        },
                    }}
                    className="relative flex flex-col items-center justify-center z-20"
                >
                    {/* Logo Mark (Ticket Stub) — larger */}
                    <div className="relative mb-10">
                        <motion.svg
                            width="140"
                            height="94"
                            viewBox="0 0 96 64"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            variants={{
                                initial: { opacity: 0, scale: 0.85 },
                                animate: { opacity: 1, scale: 1, transition: { delay: 0.3, type: "spring", stiffness: 180, damping: 14 } },
                            }}
                        >
                            {/* Outer ticket shape with scalloped notches */}
                            <motion.path
                                d="M8 4H88C90.2 4 92 5.8 92 8V24C89 24 86.5 26.5 86.5 29.5C86.5 32.5 89 35 92 35V56C92 58.2 90.2 60 88 60H8C5.8 60 4 58.2 4 56V35C7 35 9.5 32.5 9.5 29.5C9.5 26.5 7 24 4 24V8C4 5.8 5.8 4 8 4Z"
                                stroke="#C8E64A"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.4 }}
                            />
                            {/* Vertical dashed tear line */}
                            <motion.path
                                d="M30 10V54"
                                stroke="#C8E64A"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.35 }}
                                transition={{ duration: 0.6, delay: 1.4, ease: 'easeOut' }}
                            />
                            {/* Star / sparkle on stub side */}
                            <motion.path
                                d="M17 30L18.5 26L20 30L24 31.5L20 33L18.5 37L17 33L13 31.5Z"
                                stroke="#C8E64A"
                                strokeWidth="1"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.5 }}
                                transition={{ duration: 0.5, delay: 1.6, ease: 'easeOut' }}
                            />
                            {/* Detail lines on the main section */}
                            <motion.path
                                d="M40 22H78"
                                stroke="#C8E64A"
                                strokeWidth="1"
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.3 }}
                                transition={{ duration: 0.4, delay: 1.7, ease: 'easeOut' }}
                            />
                            <motion.path
                                d="M40 30H66"
                                stroke="#C8E64A"
                                strokeWidth="1"
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.2 }}
                                transition={{ duration: 0.4, delay: 1.85, ease: 'easeOut' }}
                            />
                            <motion.path
                                d="M40 38H56"
                                stroke="#C8E64A"
                                strokeWidth="1"
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.15 }}
                                transition={{ duration: 0.4, delay: 2.0, ease: 'easeOut' }}
                            />
                        </motion.svg>

                        {/* Glow pulse behind ticket */}
                        <motion.div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-tc-lime/20 rounded-full blur-2xl"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                                scale: [0, 4],
                                opacity: [0, 0.5, 0],
                            }}
                            transition={{
                                duration: 0.8,
                                delay: 2.2,
                                ease: 'easeOut',
                            }}
                        />
                    </div>

                    {/* Brand Name — "ticketer" with gradient and tight tracking */}
                    <motion.h1
                        variants={{
                            initial: { y: 24, opacity: 0 },
                            animate: { y: 0, opacity: 1 },
                        }}
                        transition={{
                            duration: 0.6,
                            ease: [0.22, 1, 0.36, 1],
                            delay: 0.8,
                        }}
                        className="font-display font-black text-[42px] sm:text-[52px] md:text-[64px] tracking-[-0.03em] leading-none bg-gradient-to-r from-tc-lime via-white to-tc-lime bg-clip-text text-transparent"
                    >
                        ticketer
                    </motion.h1>

                    {/* Subheading */}
                    <motion.p
                        variants={{
                            initial: { y: 12, opacity: 0 },
                            animate: { y: 0, opacity: 1 },
                        }}
                        transition={{
                            duration: 0.6,
                            ease: 'easeOut',
                            delay: 1.2,
                        }}
                        className="mt-4 font-body font-medium text-[13px] sm:text-[14px] md:text-[15px] tracking-[0.12em] uppercase text-center"
                        style={{
                            background: 'linear-gradient(90deg, #6B6B6B, #C8E64A, #6B6B6B)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Campus Culture, Reimagined
                    </motion.p>

                    {/* Accent line under subheading */}
                    <motion.div
                        className="mt-4 h-[1px] bg-gradient-to-r from-transparent via-tc-lime/50 to-transparent"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 80, opacity: 1 }}
                        transition={{ delay: 1.6, duration: 0.6, ease: 'easeOut' }}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
