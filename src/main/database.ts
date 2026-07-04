import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'

// Define paths
const dbDir = path.join(app.getPath('userData'), 'database')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}
const dbPath = path.join(dbDir, 'accounting_v4.db')

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
    // We will generate 100 scenarios based on 6 base templates
    for (let i = 1; i <= 100; i++) {
      const templateIndex = i % 6
      const multiplier = 1 + (i % 5) * 0.5 // Varied amounts

      if (templateIndex === 1) {
        // Personel İş Avansı
        const amount = 5000 * multiplier
        const result = insertScenario.run(
          `Personel İş Avansı (Senaryo ${i})`,
          `Kurum personeline kurum hizmetlerinde kullanılmak üzere ${amount.toLocaleString('tr-TR')} TL nakit iş avansı verilmiştir.`,
          'kolay'
        )
        const s_id = result.lastInsertRowid
        insertEntry.run(s_id, '162', '', 'borc', amount)
        insertEntry.run(s_id, '100', '', 'alacak', amount)

      } else if (templateIndex === 2) {
        // Vezne Tahsilatı (Peşin Vergi)
        const amount = 10000 * multiplier
        const result = insertScenario.run(
          `Vezne Tahsilatı - Peşin Vergi (Senaryo ${i})`,
          `Vezneye ${amount.toLocaleString('tr-TR')} TL nakit vergi tahsilatı yapılmıştır. Tahakkuk ve tahsilat aynı anda gerçekleşmiştir. (Bütçe hesapları dahil hem mali hem bütçe kaydını yapınız)\n\n💡 İpucu: Gelir ve Bütçe Geliri hesapları için "01.1.2.01" ekonomik kodunu kullanabilirsiniz.`,
          'orta'
        )
        const s_id = result.lastInsertRowid
        insertEntry.run(s_id, '100', '', 'borc', amount)
        insertEntry.run(s_id, '600', '01.1.2.01', 'alacak', amount)
        insertEntry.run(s_id, '805', '', 'borc', amount)
        insertEntry.run(s_id, '800', '01.1.2.01', 'alacak', amount)

      } else if (templateIndex === 3) {
        // Doğrudan Temin Mal Alımı
        const total = 12000 * multiplier
        const kdv = 1000 * multiplier
        const net = total - kdv
        const result = insertScenario.run(
          `Doğrudan Temin Kırtasiye Alımı (Senaryo ${i})`,
          `Doğrudan temin usulüyle kırtasiye malzemesi (İlk Madde ve Malzeme) alınmış ve KDV dahil toplam ${total.toLocaleString('tr-TR')} TL fatura kesilmiştir. KDV tevkifatı yapılarak ${kdv.toLocaleString('tr-TR')} TL KDV vergi dairesine ödenecekler (360) arasına alınmış, kalan net tutar esnafa ödenmek üzere Bütçe Emanetlerine (320) aktarılmıştır.\n\n💡 İpucu: İlk Madde ve Malzeme hesabı için "03.2.1.01" ekonomik kodunu kullanabilirsiniz.`,
          'orta'
        )
        const s_id = result.lastInsertRowid
        insertEntry.run(s_id, '150', '03.2.1.01', 'borc', total)
        insertEntry.run(s_id, '360', '', 'alacak', kdv)
        insertEntry.run(s_id, '320', '', 'alacak', net)

      } else if (templateIndex === 4) {
        // İş Avansının Kapatılması (Mahsup)
        const avans = 5000 * multiplier
        const harcama = 4000 * multiplier
        const iade = avans - harcama
        const result = insertScenario.run(
          `İş Avansının Kapatılması (Senaryo ${i})`,
          `Personele verilen ${avans.toLocaleString('tr-TR')} TL avansın ${harcama.toLocaleString('tr-TR')} TL'si ile kırtasiye malzemesi (İlk Madde ve Malzeme) alınmış, kalan ${iade.toLocaleString('tr-TR')} TL nakit olarak vezneye iade edilmiştir. (Avans Kapatma İşlemi - Bütçe hesapları hariç).\n\n💡 İpucu: İlk Madde ve Malzeme hesabı için "03.2.1.01" kodunu kullanabilirsiniz.`,
          'orta'
        )
        const s_id = result.lastInsertRowid
        insertEntry.run(s_id, '150', '03.2.1.01', 'borc', harcama)
        insertEntry.run(s_id, '100', '', 'borc', iade)
        insertEntry.run(s_id, '162', '', 'alacak', avans)

      } else if (templateIndex === 5) {
        // Maaş Ödemesi
        const brut = 100000 * multiplier
        const sgk = 14000 * multiplier
        const vergi = 15000 * multiplier
        const icra = 1000 * multiplier
        const net = brut - sgk - vergi - icra
        const result = insertScenario.run(
          `Maaş Ödemesi Tahakkuku (Senaryo ${i})`,
          `Kurum personeline ${brut.toLocaleString('tr-TR')} TL brüt maaş tahakkuk ettirilmiştir. Kanunlar gereği kesintiler: ${sgk.toLocaleString('tr-TR')} TL SGK Primi (361), ${vergi.toLocaleString('tr-TR')} TL Gelir ve Damga Vergisi (360), ${icra.toLocaleString('tr-TR')} TL İcra/Nafaka kesintisi (332). Kalan net tutar banka aracılığıyla personele ödenmek üzere talimatlandırılmıştır (103).\n\n💡 İpucu: Gider Hesabı (630) için "01.1.1.01" (Temel Maaşlar) ekonomik kodunu kullanınız.`,
          'zor'
        )
        const s_id = result.lastInsertRowid
        insertEntry.run(s_id, '630', '01.1.1.01', 'borc', brut)
        insertEntry.run(s_id, '361', '', 'alacak', sgk)
        insertEntry.run(s_id, '360', '', 'alacak', vergi)
        insertEntry.run(s_id, '332', '', 'alacak', icra)
        insertEntry.run(s_id, '103', '', 'alacak', net)

      } else {
        // Müteahhit Hakedişi
        const hakedis = 200000 * multiplier
        const teminat = 12000 * multiplier
        const vergi = 2000 * multiplier
        const net = hakedis - teminat - vergi
        const result = insertScenario.run(
          `Müteahhit Hakedişi - Fen İşleri (Senaryo ${i})`,
          `Fen İşleri tarafından yaptırılan bir yatırım (yapım) işi için müteahhide ${hakedis.toLocaleString('tr-TR')} TL hakediş düzenlenmiştir. Kamu İhale Kanunu gereği %6 Kesin Teminat (${teminat.toLocaleString('tr-TR')} TL) ve sözleşme gereği Damga Vergisi (${vergi.toLocaleString('tr-TR')} TL) kesilmiştir. Kalan tutar müteahhide ödenmek üzere Bütçe Emanetine alınmıştır.\n\n💡 İpucu: Tesis, Makine ve Cihazlar Hesabı (258) için "06.5.7.90" ekonomik kodunu kullanınız.`,
          'zor'
        )
        const s_id = result.lastInsertRowid
        insertEntry.run(s_id, '258', '06.5.7.90', 'borc', hakedis)
        insertEntry.run(s_id, '330', '', 'alacak', teminat)
        insertEntry.run(s_id, '360', '', 'alacak', vergi)
        insertEntry.run(s_id, '320', '', 'alacak', net)
      }
    }
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
