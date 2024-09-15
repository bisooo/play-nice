"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";

export const BackgroundLines = ({
  children,
  className,
  svgOptions,
  colors,
}: {
  children: React.ReactNode;
  className?: string;
  svgOptions?: {
    duration?: number;
  };
  colors: string[];
}) => {
  return (
    <div className={cn("relative w-full min-h-screen", className)}>
      <SVG svgOptions={svgOptions} colors={colors} />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

const pathVariants = {
  initial: { strokeDashoffset: 800, strokeDasharray: "50 800" },
  animate: {
    strokeDashoffset: 0,
    strokeDasharray: "20 800",
    opacity: [0, 1, 1, 0],
  },
};

const SVG = ({
  svgOptions,
  colors,
}: {
  svgOptions?: {
    duration?: number;
  };
  colors: string[];
}) => {
  const [paths, setPaths] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState({ width: 100, height: 100 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    const generatePaths = () => {
      const newPaths = [];
      const lineCount = window.innerWidth < 768 ? 24 : 48;
      for (let i = 0; i < lineCount; i++) {
        const startX = Math.random() * dimensions.width;
        const startY = Math.random() * dimensions.height;
        const endX = Math.random() * dimensions.width;
        const endY = Math.random() * dimensions.height;
        const controlX1 = Math.random() * dimensions.width;
        const controlY1 = Math.random() * dimensions.height;
        const controlX2 = Math.random() * dimensions.width;
        const controlY2 = Math.random() * dimensions.height;
        newPaths.push(
          `M${startX} ${startY} C${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`
        );
      }
      setPaths(newPaths);
    };

    generatePaths();
  }, [dimensions]);

  return (
    <motion.svg
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="absolute inset-0 w-full h-full"
    >
      {paths.map((path, idx) => (
        <motion.path
          key={`path-${idx}`}
          d={path}
          stroke={colors[idx % colors.length]}
          strokeWidth="2"
          strokeLinecap="round"
          variants={pathVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: svgOptions?.duration || 10,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop",
            delay: Math.random() * 5,
          }}
        />
      ))}
    </motion.svg>
  );
};
