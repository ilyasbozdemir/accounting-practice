export interface IElectronAPI {
  loadPreferences: () => Promise<void>
  // Add more methods here
}

export interface ICustomAPI {
  getScenarios: () => Promise<any[]>
  getScenario: (id: number) => Promise<any>
  saveProgress: (scenarioId: number, isCorrect: boolean) => Promise<void>
}

declare global {
  interface Window {
    electron: IElectronAPI
    api: ICustomAPI
  }
}
