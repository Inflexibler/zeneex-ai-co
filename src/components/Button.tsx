import Link from "next/link";
import Loader from "./Loader";
import { motion } from "framer-motion";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  loading?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  type = "button",
  disabled = false,
  onClick,
  className = "",
  loading = false,
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-dark focus:ring-primary shadow-sm hover:shadow",
    secondary:
      "bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary shadow-sm hover:shadow",
    outline:
      "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-500 hover:border-neutral-400",
    ghost:
      "bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`.trim();

  const content = loading ? <Loader size={size === "sm" ? "sm" : "md"} /> : children;

  if (href) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link href={href} className={classes}>
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={classes}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
    >
      {content}
    </motion.button>
  );
}
