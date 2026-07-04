import { useEffect, useState } from "react";
import { CheckCircle, FileText, List, Save, XCircle, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { JournalForm } from "./components/JournalForm";
import { useAppStore } from "./store/useAppStore";
import { Scenario } from "./core/types";

type ViewMode = 'scenarios' | 'rehber';

function App(): JSX.Element {
  const { currentScenario, loadScenario, validateEntries, feedback } =
    useAppStore();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('scenarios');

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

  const currentIndex = currentScenario ? scenarios.findIndex(s => s.id === currentScenario.id) : -1;

  const navigateScenario = async (direction: 'next' | 'prev') => {
    if (currentIndex === -1) return;
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < scenarios.length) {
      const nextScenarioId = scenarios[nextIndex].id;
      const fullScenario = await window.api.getScenario(nextScenarioId);
      loadScenario(fullScenario);
      // Scroll sidebar to the selected item smoothly
      document.getElementById(`scenario-btn-${nextScenarioId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
      <header className="flex items-center justify-between border-b px-6 py-4 bg-card z-10 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Kamu Muhasebesi Pratik</h1>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('scenarios')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'scenarios' ? 'bg-background shadow-sm' : 'hover:bg-muted'}`}
          >
            Senaryolar
          </button>
          <button 
            onClick={() => setViewMode('rehber')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'rehber' ? 'bg-background shadow-sm text-primary' : 'hover:bg-muted'}`}
          >
            <BookOpen className="h-4 w-4" />
            2026-2028 Bütçe Rehberi
          </button>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {viewMode === 'scenarios' ? (
          <>
            {/* Left Sidebar - Scenarios */}
            <aside className="w-80 border-r bg-muted/10 flex flex-col shrink-0">
              <div className="p-4 border-b bg-muted/20 flex items-center justify-between font-semibold text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Senaryo Listesi
                </div>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{scenarios.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {scenarios.map((s, index) => (
                  <button
                    id={`scenario-btn-${s.id}`}
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
                      <span className="font-semibold text-sm leading-tight">{index + 1}. {s.title}</span>
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
            <main className="flex-1 overflow-y-auto p-8 bg-slate-50/30 dark:bg-slate-950/30 flex flex-col items-center">
              <div className="w-full max-w-4xl rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden mb-8">
                {currentScenario
                  ? (
                    <>
                      <div className="flex flex-col space-y-1.5 p-6 border-b bg-card">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold leading-none tracking-tight text-lg">
                            {currentIndex + 1}. {currentScenario.title}
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
                        <div className="mb-6 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 whitespace-pre-wrap">
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
                      <div className="flex items-center justify-between p-5 border-t bg-muted/20">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigateScenario('prev')}
                            disabled={currentIndex <= 0}
                            className="flex items-center gap-1 rounded-md border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50 transition-all"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Önceki
                          </button>
                          <button
                            onClick={() => navigateScenario('next')}
                            disabled={currentIndex >= scenarios.length - 1}
                            className="flex items-center gap-1 rounded-md border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50 transition-all"
                          >
                            Sonraki
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
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
          </>
        ) : (
          <main className="flex-1 bg-background relative">
            <div className="absolute inset-0 p-4">
              <div className="w-full h-full rounded-xl border bg-muted/30 flex items-center justify-center flex-col gap-4">
                <BookOpen className="h-16 w-16 text-muted-foreground/50" />
                <h2 className="text-xl font-semibold text-muted-foreground">Bütçe Hazırlama Rehberi</h2>
                <p className="text-sm text-muted-foreground max-w-md text-center">
                  2026-2028 Dönemi Bütçe Hazırlama Rehberi dökümanını görüntülemek için, lütfen rehber PDF dosyasını projenin ana dizinine veya <code>public/rehber.pdf</code> olarak ekleyin veya <a href="https://www.sbb.gov.tr/butce-hazirlama-rehberleri/" target="_blank" rel="noreferrer" className="text-primary hover:underline">SBB web sitesinden</a> güncel rehberi indirin.
                </p>
                <a href="https://www.sbb.gov.tr/wp-content/uploads/2024/09/2025-2027_Donemi_Butce_Hazirlama_Rehberi.pdf" target="_blank" rel="noreferrer" className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors">
                  Tarayıcıda Aç
                </a>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
