interface SplashScreenProps {
  readonly message?: string;
}

export default function SplashScreen({ message = "Loading" }: SplashScreenProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background text-foreground">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent/40 border-t-accent" aria-hidden="true" />
      <p className="mt-4 text-sm text-foreground/70">{message}</p>
    </div>
  );
}
