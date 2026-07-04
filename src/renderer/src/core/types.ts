export interface ExpectedEntry {
  id: number
  scenario_id: number
  account_code: string
  economic_code: string | null
  type: 'borc' | 'alacak'
  amount: number
}

export interface Scenario {
  id: number
  title: string
  description: string
  difficulty: 'kolay' | 'orta' | 'zor'
  created_at: string
  expectedEntries?: ExpectedEntry[]
}

export interface JournalEntry {
  id: string // Client-side generated UUID
  account_code: string
  economic_code: string
  type: 'borc' | 'alacak'
  amount: number
}

// Global Validation Response
export interface ValidationResult {
  isCorrect: boolean
  message: string
}
