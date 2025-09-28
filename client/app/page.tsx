import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 bg-background text-foreground">
      <header className="row-start-2 flex flex-col items-center gap-8">
        <h1 className="text-2xl font-bold">Blue Relief</h1>
        <Logo size="xl" />
        <p className="text-center text-muted-foreground">Logo should appear above this text</p>
      </header>
    </div>
  );
}
