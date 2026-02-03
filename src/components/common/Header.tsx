type HeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-white px-8">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </header>
  );
}
