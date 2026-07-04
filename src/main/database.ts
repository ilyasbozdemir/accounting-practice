import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'

// Define paths
const dbDir = path.join(app.getPath('userData'), 'database')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}
const dbPath = path.join(dbDir, 'accounting_v2.db')

// Initialize DB
const db = new Database(dbPath, { verbose: console.log })

// Setup basic tables
export function initDB(): void {
  // Geçici olarak veritabanını sıfırlayıp yeni senaryoları yüklemek için tabloları uçuruyoruz:
  db.exec(`
    DROP TABLE IF EXISTS user_progress;
    DROP TABLE IF EXISTS expected_entries;
    DROP TABLE IF EXISTS scenarios;
  `)

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
    // Scenario 1: Maaş Ödemesi
    const result1 = insertScenario.run(
      'Maaş Ödemesi Tahakkuku ve Kesintiler',
      'Kurum personeline 100.000 TL brüt maaş tahakkuk ettirilmiştir. Kanunlar gereği kesintiler: 14.000 TL SGK Primi (361), 15.000 TL Gelir ve Damga Vergisi (360), 1.000 TL İcra/Nafaka kesintisi (332). Kalan net tutar banka aracılığıyla personele ödenmek üzere talimatlandırılmıştır (103). İlgili yevmiye kaydını oluşturunuz.',
      'zor'
    )
    const s1_id = result1.lastInsertRowid
    insertEntry.run(s1_id, '630', '01.1', 'borc', 100000)
    insertEntry.run(s1_id, '361', '01.1', 'alacak', 14000)
    insertEntry.run(s1_id, '360', '01.1', 'alacak', 15000)
    insertEntry.run(s1_id, '332', '01.1', 'alacak', 1000)
    insertEntry.run(s1_id, '103', '01.1', 'alacak', 70000)

    // Scenario 2: Müteahhit Hakedişi
    const result2 = insertScenario.run(
      'Müteahhit Hakedişi (Fen İşleri)',
      'Fen İşleri tarafından yaptırılan bir yatırım (yapım) işi için müteahhide 200.000 TL hakediş düzenlenmiştir. Kamu İhale Kanunu gereği %6 Kesin Teminat (12.000 TL) ve sözleşme gereği Damga Vergisi (2.000 TL) kesilmiştir. Kalan tutar müteahhide ödenmek üzere Bütçe Emanetine alınmıştır.',
      'zor'
    )
    const s2_id = result2.lastInsertRowid
    insertEntry.run(s2_id, '258', '06.5', 'borc', 200000)
    insertEntry.run(s2_id, '330', '01.1', 'alacak', 12000)
    insertEntry.run(s2_id, '360', '01.1', 'alacak', 2000)
    insertEntry.run(s2_id, '320', '01.1', 'alacak', 186000)

    // Scenario 3: Doğrudan Temin Mal Alımı
    const result3 = insertScenario.run(
      'Doğrudan Temin Kırtasiye Alımı (KDV Tevkifatı)',
      'Doğrudan temin usulüyle kırtasiye malzemesi (İlk Madde ve Malzeme) alınmış ve KDV dahil toplam 12.000 TL fatura kesilmiştir. KDV tevkifatı yapılarak 1.000 TL KDV vergi dairesine ödenecekler (360) arasına alınmış, kalan net tutar esnafa ödenmek üzere Bütçe Emanetlerine aktarılmıştır.',
      'orta'
    )
    const s3_id = result3.lastInsertRowid
    insertEntry.run(s3_id, '150', '03.2', 'borc', 12000)
    insertEntry.run(s3_id, '360', '01.1', 'alacak', 1000)
    insertEntry.run(s3_id, '320', '01.1', 'alacak', 11000)

    // Scenario 4: Vezne Tahsilatı (Peşin Vergi)
    const result4 = insertScenario.run(
      'Vezne Tahsilatı (Peşin Vergi)',
      'Vezneye 10.000 TL nakit vergi tahsilatı yapılmıştır. Tahakkuk ve tahsilat aynı anda gerçekleşmiştir. (Bütçe hesapları dahil hem mali hem bütçe kaydını yapınız)',
      'orta'
    )
    const s4_id = result4.lastInsertRowid
    insertEntry.run(s4_id, '100', '01.1', 'borc', 10000)
    insertEntry.run(s4_id, '600', '01.1.2.01', 'alacak', 10000)
    insertEntry.run(s4_id, '805', '01.1', 'borc', 10000)
    insertEntry.run(s4_id, '800', '01.1.2.01', 'alacak', 10000)

    // Scenario 5: Personel İş Avansı
    const result5 = insertScenario.run(
      'Personel İş Avansı',
      'Kurum personeline kurum hizmetlerinde kullanılmak üzere 5.000 TL nakit iş avansı verilmiştir.',
      'kolay'
    )
    const s5_id = result5.lastInsertRowid
    insertEntry.run(s5_id, '162', '01.1', 'borc', 5000)
    insertEntry.run(s5_id, '103', '01.1', 'alacak', 5000)

    // Scenario 6: İş Avansının Kapatılması (Mahsup)
    const result6 = insertScenario.run(
      'İş Avansının Kapatılması (Mahsup)',
      'Personele verilen 5.000 TL avansın 4.000 TL\'si ile kırtasiye malzemesi (İlk Madde ve Malzeme) alınmış, kalan 1.000 TL nakit olarak vezneye iade edilmiştir. (Avans Kapatma İşlemi - Bütçe hesapları dahil değil)',
      'orta'
    )
    const s6_id = result6.lastInsertRowid
    insertEntry.run(s6_id, '150', '03.2', 'borc', 4000)
    insertEntry.run(s6_id, '100', '01.1', 'borc', 1000)
    insertEntry.run(s6_id, '162', '01.1', 'alacak', 5000)
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
