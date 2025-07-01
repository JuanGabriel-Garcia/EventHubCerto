import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  text?: string;
}

export function LoadingSpinner({ className, text = "Carregando..." }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8", className)}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
      <p className="text-gray-500">{text}</p>
    </div>
  );
}
