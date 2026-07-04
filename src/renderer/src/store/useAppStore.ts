import { create } from 'zustand'
import { Scenario, JournalEntry, ValidationResult } from '../core/types'

interface AppState {
  currentScenario: Scenario | null
  entries: JournalEntry[]
  feedback: ValidationResult | null
  loadScenario: (scenario: Scenario) => void
  addEntry: (entry: JournalEntry) => void
  removeEntry: (id: string) => void
  updateEntry: (id: string, entry: Partial<JournalEntry>) => void
  validateEntries: () => void
  reset: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentScenario: null,
  entries: [],
  feedback: null,

  loadScenario: (scenario) => set({ currentScenario: scenario, entries: [], feedback: null }),

  addEntry: (entry) => set((state) => ({ entries: [...state.entries, entry] })),

  removeEntry: (id) => set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),

  updateEntry: (id, updatedFields) =>
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, ...updatedFields } : e)),
    })),

  validateEntries: () => {
    const { entries, currentScenario } = get()
    if (!currentScenario || !currentScenario.expectedEntries) {
      set({ feedback: { isCorrect: false, message: 'Senaryo yüklenemedi veya beklenmeyen hata.' } })
      return
    }

    // Basic Validation: Borç/Alacak Toplamları Eşit Mi?
    const totalBorc = entries.filter((e) => e.type === 'borc').reduce((acc, e) => acc + e.amount, 0)
    const totalAlacak = entries.filter((e) => e.type === 'alacak').reduce((acc, e) => acc + e.amount, 0)

    if (totalBorc !== totalAlacak) {
      set({ feedback: { isCorrect: false, message: `Hata: Borç (${totalBorc}) ve Alacak (${totalAlacak}) toplamları eşit değil!` } })
      return
    }

    if (entries.length === 0) {
      set({ feedback: { isCorrect: false, message: 'Lütfen en az bir yevmiye satırı ekleyin.' } })
      return
    }

    // Advanced Validation: Beklenen kayıtlar ile eşleşiyor mu?
    const expected = currentScenario.expectedEntries
    let isPerfectMatch = true

    // Check if every expected entry is fulfilled
    for (const exp of expected) {
      const match = entries.find(
        (e) =>
          e.account_code === exp.account_code &&
          e.type === exp.type &&
          e.amount === exp.amount
      )
      if (!match) {
        isPerfectMatch = false
        break
      }
    }

    if (isPerfectMatch && expected.length === entries.length) {
      set({ feedback: { isCorrect: true, message: 'Tebrikler! Yevmiye kaydı tamamen doğru.' } })
      // Trigger save progress
      window.api.saveProgress(currentScenario.id, true)
    } else {
      set({ feedback: { isCorrect: false, message: 'Kayıt dengede ancak kullanılan hesaplar veya tutarlar senaryo ile uyuşmuyor.' } })
      window.api.saveProgress(currentScenario.id, false)
    }
  },

  reset: () => set({ entries: [], feedback: null })
}))
