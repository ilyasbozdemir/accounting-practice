import { useEffect, useState } from "react";
import { CheckCircle, FileText, List, Save, XCircle } from "lucide-react";
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
    <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
      <header className="flex items-center justify-between border-b px-6 py-4 bg-card z-10 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Kamu Muhasebesi Pratik</h1>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Scenarios */}
        <aside className="w-80 border-r bg-muted/10 flex flex-col shrink-0">
          <div className="p-4 border-b bg-muted/20 flex items-center gap-2 font-semibold text-sm text-muted-foreground">
            <List className="h-4 w-4" />
            Senaryo Listesi
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={async () => {
                  const fullScenario = await window.api.getScenario(s.id);
                  loadScenario(fullScenario);
                }}
                className={`flex w-full flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all hover:bg-accent/50 ${
                  currentScenario?.id === s.id
                    ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                    : 'bg-card hover:border-border/80'
                }`}
              >
                <div className="flex w-full justify-between items-start gap-2">
                  <span className="font-semibold text-sm leading-tight">{s.title}</span>
                  <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    s.difficulty === 'kolay' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' :
                    s.difficulty === 'orta' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {s.difficulty.toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{s.description}</span>
              </button>
            ))}
            {scenarios.length === 0 && (
              <div className="text-center text-sm text-muted-foreground p-4">
                Senaryo bulunamadı.
              </div>
            )}
          </div>
        </aside>

        {/* Right Main Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/30 dark:bg-slate-950/30">
          <div className="mx-auto max-w-4xl rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            {currentScenario
              ? (
                <>
                  <div className="flex flex-col space-y-1.5 p-6 border-b bg-card">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold leading-none tracking-tight text-lg">
                        {currentScenario.title}
                      </h3>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        currentScenario.difficulty === 'kolay' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' :
                        currentScenario.difficulty === 'orta' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {currentScenario.difficulty.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground pt-2">
                      İlgili hesap ve ekonomik kodları kullanarak yevmiye kaydını oluşturun.
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="mb-6 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4">
                      <p className="font-medium text-[15px] leading-relaxed text-blue-900 dark:text-blue-200">
                        {currentScenario.description}
                      </p>
                    </div>
                    
                    <div className="rounded-lg border bg-background shadow-sm">
                      <div className="p-1">
                        <JournalForm />
                      </div>
                    </div>

                    {feedback && (
                      <div
                        className={`mt-6 p-4 rounded-lg border flex items-start gap-3 shadow-sm ${
                          feedback.isCorrect
                            ? "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-300"
                            : "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300"
                        }`}
                      >
                        {feedback.isCorrect
                          ? <CheckCircle className="h-5 w-5 mt-0.5 shrink-0" />
                          : <XCircle className="h-5 w-5 mt-0.5 shrink-0" />}
                        <div>
                          <h4 className="font-semibold text-sm">
                            {feedback.isCorrect ? "Kayıt Başarılı!" : "Kayıt Hatalı!"}
                          </h4>
                          <p className="text-sm mt-1 opacity-90">{feedback.message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-end p-5 border-t bg-muted/20">
                    <button
                      onClick={validateEntries}
                      className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 shadow transition-all active:scale-[0.98]"
                    >
                      <Save className="h-4 w-4" />
                      Kaydet ve Kontrol Et
                    </button>
                  </div>
                </>
              )
              : (
                <div className="p-20 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="text-muted-foreground font-medium">Senaryolar yükleniyor...</p>
                </div>
              )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
