import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'

// Define paths
const dbDir = path.join(app.getPath('userData'), 'database')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}
const dbPath = path.join(dbDir, 'accounting.db')

// Initialize DB
const db = new Database(dbPath, { verbose: console.log })

// Setup basic tables
export function initDB(): void {
  const createTables = `
    CREATE TABLE IF NOT EXISTS scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT DEFAULT 'kolay',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expected_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_id INTEGER,
      account_code TEXT NOT NULL,
      economic_code TEXT,
      type TEXT CHECK(type IN ('borc', 'alacak')) NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_id INTEGER,
      is_correct BOOLEAN NOT NULL,
      attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
    );
  `
  db.exec(createTables)
  
  // Seed initial data if empty
  const count = db.prepare('SELECT count(*) as count FROM scenarios').get() as { count: number }
  if (count.count === 0) {
    seedData()
  }
}

function seedData(): void {
  const insertScenario = db.prepare('INSERT INTO scenarios (title, description, difficulty) VALUES (?, ?, ?)')
  const insertEntry = db.prepare('INSERT INTO expected_entries (scenario_id, account_code, economic_code, type, amount) VALUES (?, ?, ?, ?, ?)')

  const transaction = db.transaction(() => {
    // Scenario 1: Nakit Vergi Tahsilatı
    const result1 = insertScenario.run('Vergi Tahsilatı', 'Vezneye 10.000 TL nakit vergi tahsilatı yapılmıştır. İlgili yevmiye kaydını oluşturunuz.', 'kolay')
    const s1_id = result1.lastInsertRowid
    insertEntry.run(s1_id, '100', '01.1', 'borc', 10000)
    insertEntry.run(s1_id, '600', '01.1.2.01', 'alacak', 10000)

    // Scenario 2: Personel Avans Ödemesi
    const result2 = insertScenario.run('Personel Avansı', 'Personele 5.000 TL nakit iş avansı verilmiştir.', 'orta')
    const s2_id = result2.lastInsertRowid
    insertEntry.run(s2_id, '162', '03.4.1.01', 'borc', 5000)
    insertEntry.run(s2_id, '100', '01.1', 'alacak', 5000)
  })

  transaction()
}

// IPC Handlers implementation
export const dbHandlers = {
  getScenarios: () => {
    return db.prepare('SELECT * FROM scenarios').all()
  },
  getScenarioWithEntries: (id: number) => {
    const scenario = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(id)
    if (!scenario) return null
    const entries = db.prepare('SELECT * FROM expected_entries WHERE scenario_id = ?').all(id)
    return { ...scenario, expectedEntries: entries }
  },
  saveProgress: (scenarioId: number, isCorrect: boolean) => {
    const stmt = db.prepare('INSERT INTO user_progress (scenario_id, is_correct) VALUES (?, ?)')
    return stmt.run(scenarioId, isCorrect ? 1 : 0)
  }
}
