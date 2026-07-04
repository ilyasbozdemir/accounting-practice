import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { v4 as uuidv4 } from 'uuid' // Need to install uuid

export function JournalForm() {
  const { entries, addEntry, removeEntry, updateEntry } = useAppStore()

  const handleAddEntry = () => {
    addEntry({
      id: crypto.randomUUID(),
      account_code: '',
      economic_code: '',
      type: 'borc',
      amount: 0
    })
  }

  const totalBorc = entries.filter((e) => e.type === 'borc').reduce((acc, e) => acc + e.amount, 0)
  const totalAlacak = entries.filter((e) => e.type === 'alacak').reduce((acc, e) => acc + e.amount, 0)

  return (
    <div className="space-y-4 text-left">
      <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-muted-foreground border-b pb-2">
        <div className="col-span-3">Hesap Kodu</div>
        <div className="col-span-3">Ekonomik Kod</div>
        <div className="col-span-2 text-right">Borç</div>
        <div className="col-span-2 text-right">Alacak</div>
        <div className="col-span-2 text-center">İşlem</div>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.id} className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-3">
              <input
                type="text"
                list="hesap-kodlari"
                placeholder="Örn: 100"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={entry.account_code}
                onChange={(e) => updateEntry(entry.id, { account_code: e.target.value })}
              />
            </div>
            <div className="col-span-3">
              <input
                type="text"
                placeholder="Örn: 01.1"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={entry.economic_code}
                onChange={(e) => updateEntry(entry.id, { economic_code: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="flex h-9 w-full text-right rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={entry.type === 'borc' ? entry.amount || '' : ''}
                onChange={(e) => updateEntry(entry.id, { type: 'borc', amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="flex h-9 w-full text-right rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={entry.type === 'alacak' ? entry.amount || '' : ''}
                onChange={(e) => updateEntry(entry.id, { type: 'alacak', amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-2 text-center">
              <button
                onClick={() => removeEntry(entry.id)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 w-9 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="space-x-2">
          <button
            onClick={handleAddEntry}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="mr-2 h-4 w-4" /> Yeni Satır Ekle
          </button>
        </div>
        
        <div className="text-sm font-semibold flex space-x-6">
          <div className={`flex flex-col items-end ${totalBorc !== totalAlacak ? 'text-destructive' : 'text-primary'}`}>
            <span className="text-xs text-muted-foreground">Toplam Borç</span>
            <span>{totalBorc.toLocaleString('tr-TR')} ₺</span>
          </div>
          <div className={`flex flex-col items-end ${totalBorc !== totalAlacak ? 'text-destructive' : 'text-primary'}`}>
            <span className="text-xs text-muted-foreground">Toplam Alacak</span>
            <span>{totalAlacak.toLocaleString('tr-TR')} ₺</span>
          </div>
        </div>
      </div>

      <datalist id="hesap-kodlari">
        <option value="100">100 - Kasa Hesabı</option>
        <option value="102">102 - Bankalar Hesabı</option>
        <option value="103">103 - Verilen Çekler ve Ödeme Emirleri (-)</option>
        <option value="120">120 - Alıcılar Hesabı</option>
        <option value="140">140 - Kişilerden Alacaklar Hesabı</option>
        <option value="150">150 - İlk Madde ve Malzemeler Hesabı</option>
        <option value="162">162 - Bütçe Dışı Avans ve Krediler</option>
        <option value="253">253 - Tesis, Makine ve Cihazlar Hesabı</option>
        <option value="258">258 - Yapılmakta Olan Yatırımlar</option>
        <option value="320">320 - Bütçe Emanetleri Hesabı</option>
        <option value="330">330 - Alınan Depozito ve Teminatlar</option>
        <option value="332">332 - İcra Kesintileri vb. Emanetler</option>
        <option value="333">333 - Emanetler Hesabı</option>
        <option value="360">360 - Ödenecek Vergi ve Fonlar (KDV, Damga, Gelir Vergisi)</option>
        <option value="361">361 - Ödenecek Sosyal Güvenlik Kesintileri</option>
        <option value="600">600 - Gelirler Hesabı</option>
        <option value="630">630 - Giderler Hesabı</option>
        <option value="800">800 - Bütçe Gelirleri Hesabı</option>
        <option value="805">805 - Gelir Yansıtma Hesabı</option>
        <option value="830">830 - Bütçe Giderleri Hesabı</option>
      </datalist>
    </div>
  )
}
