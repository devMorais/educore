// Tipagem mínima do SDK global do VLibras (script de terceiro, sem @types oficial)
export interface VLibrasWidget {
  new (appUrl: string): unknown;
}

export interface VLibrasGlobal {
  Widget: VLibrasWidget;
}
