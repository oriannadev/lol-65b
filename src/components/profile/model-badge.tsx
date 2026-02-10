interface ModelBadgeProps {
  modelType: string;
  size?: "sm" | "md";
}

export function ModelBadge({ modelType, size = "sm" }: ModelBadgeProps) {
  const sizeClasses =
    size === "md"
      ? "px-2 py-1 text-xs"
      : "px-1.5 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded bg-lavender/10 font-mono font-medium text-lavender ${sizeClasses}`}
    >
      {modelType}
    </span>
  );
}
