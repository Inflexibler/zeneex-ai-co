import { motion } from "framer-motion";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "pulse";
  className?: string;
}

export default function Loader({
  size = "md",
  variant = "spinner",
  className = "",
}: LoaderProps) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const dotSizes = {
    sm: "w-1 h-1",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  if (variant === "dots") {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`${dotSizes[size]} bg-primary rounded-full`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <motion.div
        className={`${sizes[size]} border-4 border-primary/30 rounded-full border-t-primary ${className}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    );
  }

  return (
    <motion.div
      className={`${sizes[size]} border-2 border-primary/20 rounded-full border-t-primary ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
    />
  );
}
