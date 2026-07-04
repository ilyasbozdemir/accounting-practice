import { useEffect, useState } from "react";
import { CheckCircle, FileText, List, Save, XCircle, X } from "lucide-react";
import * as Dialog from '@radix-ui/react-dialog';
import { JournalForm } from "./components/JournalForm";
import { useAppStore } from "./store/useAppStore";
import { Scenario } from "./core/types";

function App(): JSX.Element {
  const { currentScenario, loadScenario, validateEntries, feedback } =
    useAppStore();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    // Load initial scenario on mount
    const fetchScenarios = async () => {
      const dbScenarios = await window.api.getScenarios();
      setScenarios(dbScenarios);
      if (dbScenarios.length > 0 && !currentScenario) {
        const fullScenario = await window.api.getScenario(dbScenarios[0].id);
        loadScenario(fullScenario);
      }
    };
    fetchScenarios();
  }, []);

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Kamu Muhasebesi Pratik</h1>
        </div>
        <div className="flex items-center gap-4">
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80">
                <List className="h-4 w-4" />
                Senaryolar
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
              <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
                <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                  <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
                    Senaryo Seçin
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">
                    Pratik yapmak istediğiniz senaryoyu seçiniz.
                  </Dialog.Description>
                </div>
                <div className="grid gap-4 py-4">
                  {scenarios.map((s) => (
                    <Dialog.Close asChild key={s.id}>
                      <button
                        onClick={async () => {
                          const fullScenario = await window.api.getScenario(s.id);
                          loadScenario(fullScenario);
                        }}
                        className={`flex flex-col items-start gap-2 rounded-lg border p-3 text-left hover:bg-accent transition-colors ${currentScenario?.id === s.id ? 'border-primary bg-primary/5' : ''}`}
                      >
                        <div className="flex w-full justify-between items-center">
                          <span className="font-semibold">{s.title}</span>
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                            {s.difficulty.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground line-clamp-1">{s.description}</span>
                      </button>
                    </Dialog.Close>
                  ))}
                </div>
                <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Kapat</span>
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl rounded-lg border bg-card text-card-foreground shadow-sm">
          {currentScenario
            ? (
              <>
                <div className="flex flex-col space-y-1.5 p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold leading-none tracking-tight text-lg">
                      Örnek Senaryo: {currentScenario.title}
                    </h3>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                      {currentScenario.difficulty.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground pt-2">
                    İlgili hesap ve ekonomik kodları kullanarak yevmiye kaydını
                    oluşturun.
                  </p>
                </div>
                <div className="p-6">
                  <p className="mb-6 font-medium text-lg leading-relaxed">
                    {currentScenario.description}
                  </p>
                  <div className="rounded-md border p-6 bg-slate-50/50 dark:bg-slate-900/50">
                    <JournalForm />
                  </div>

                  {feedback && (
                    <div
                      className={`mt-6 p-4 rounded-md border flex items-start gap-3 ${
                        feedback.isCorrect
                          ? "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-900 dark:text-green-300"
                          : "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-900 dark:text-red-300"
                      }`}
                    >
                      {feedback.isCorrect
                        ? <CheckCircle className="h-5 w-5 mt-0.5" />
                        : <XCircle className="h-5 w-5 mt-0.5" />}
                      <div>
                        <h4 className="font-semibold">
                          {feedback.isCorrect ? "Başarılı!" : "Hata!"}
                        </h4>
                        <p className="text-sm">{feedback.message}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end p-6 border-t bg-muted/40">
                  <button
                    onClick={validateEntries}
                    className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 shadow transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Kaydet ve Kontrol Et
                  </button>
                </div>
              </>
            )
            : (
              <div className="p-12 text-center text-muted-foreground">
                Senaryolar yükleniyor...
              </div>
            )}
        </div>
      </main>
    </div>
  );
}

export default App;
