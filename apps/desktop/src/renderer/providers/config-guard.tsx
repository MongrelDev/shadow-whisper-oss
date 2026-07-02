import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ConfigGuardProps {
  children: ReactNode;
}

export function ConfigGuard({ children }: ConfigGuardProps): React.ReactElement {
  const [corrupt, setCorrupt] = useState(false);
  const [errors, setErrors] = useState("");

  useEffect(() => {
    const cleanup = window.api.config.onCorrupt((errorDetails) => {
      setErrors(errorDetails);
      setCorrupt(true);
    });
    return cleanup;
  }, []);

  const handleReset = async () => {
    await window.api.config.reset();
    setCorrupt(false);
    setErrors("");
    window.location.reload();
  };

  const handleQuit = () => {
    window.close();
  };

  if (!corrupt) return <>{children}</>;

  return (
    <div className="h-screen flex items-center justify-center bg-background text-foreground p-8">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Configuração corrompida</h1>
          <p className="text-sm text-muted-foreground">
            O arquivo de configuração contém dados inválidos e não pode ser carregado.
          </p>
        </div>

        {errors && (
          <pre
            className={cn(
              "text-left text-xs text-muted-foreground bg-muted rounded-lg p-4",
              "max-h-32 overflow-auto font-mono"
            )}
          >
            {errors}
          </pre>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={handleQuit}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium",
              "border border-border text-muted-foreground",
              "hover:bg-accent transition-colors"
            )}
          >
            Fechar app
          </button>
          <button
            onClick={handleReset}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium",
              "bg-violet text-white",
              "hover:bg-violet/90 transition-colors"
            )}
          >
            Resetar configuração
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          O arquivo está em ~/Library/Application Support/ShadowWhisper/app-config.json
        </p>
      </div>
    </div>
  );
}
