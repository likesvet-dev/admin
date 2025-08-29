"use client";

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      {/* Animazione barre */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className="w-4 h-10 bg-muted-foreground/40 rounded-md animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>

      {/* Testo */}
      <p className="mt-6 text-muted-foreground text-sm font-medium animate-pulse">
        Загрузка панели управления...
      </p>
    </div>
  );
};

export default Loader;
