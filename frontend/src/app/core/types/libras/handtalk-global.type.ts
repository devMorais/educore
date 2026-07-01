// Tipagem mínima do SDK global do Hand Talk (script de terceiro, sem @types oficial)
export interface HandTalkInstance {
  translate(text: string): void;
}

export interface HandTalkConfig {
  token: string;
  align: 'left' | 'right';
  side: 'left' | 'right';
}

export interface HandTalkConstructor {
  new (config: HandTalkConfig): HandTalkInstance;
}
