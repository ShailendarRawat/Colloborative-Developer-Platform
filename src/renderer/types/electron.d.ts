export interface DesktopSource {
  id: string;
  name: string;
  thumbnail: string;
}

declare global {
  interface Window {
    electronAPI: {
      getDesktopSources: () => Promise<DesktopSource[]>;
    };
  }
}
