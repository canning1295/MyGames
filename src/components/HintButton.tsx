interface HintButtonProps {
  readonly onPress: () => void;
  readonly disabled?: boolean;
}

export default function HintButton({ onPress, disabled }: HintButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className="fixed z-20 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-background shadow-lg transition-opacity disabled:opacity-40"
      style={{
        right: "calc(1rem + env(safe-area-inset-right))",
        bottom: "calc(1rem + env(safe-area-inset-bottom))"
      }}
      aria-label="Hint"
    >
      ❔
    </button>
  );
}
