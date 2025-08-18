export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto p-4 pb-8 pt-6 md:p-6 md:pb-12 md:pt-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-muted-foreground">
              © 2025 Crowd Data Dashboard v2.0. <span className="font-medium">React + Chart.js + shadcn/ui</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
