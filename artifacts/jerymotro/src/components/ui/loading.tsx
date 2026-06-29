import { useEffect, useState } from "react";

interface LoadingPageProps {
  message?: string;
}

export default function LoadingPage({ message = "Chargement..." }: LoadingPageProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8">
        {/* Animated Logo */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <img
            src="/logo.png"
            alt="JeryMotro Logo"
            className="relative w-24 h-24 object-contain animate-bounce"
          />
        </div>

        {/* Progress Bar */}
        <div className="w-72 h-3 bg-secondary rounded-full overflow-hidden border border-border">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Loading Message */}
        <div className="text-center space-y-3">
          <p className="text-base font-semibold text-foreground">{message}</p>
          <p className="text-sm text-muted-foreground">JeryMotro — Surveillance des feux de brousse à Madagascar</p>
        </div>

        {/* Animated Dots */}
        <div className="flex gap-3">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
