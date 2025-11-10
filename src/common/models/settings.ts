export interface Shortcuts {
  nextCharacter: string;
  previousCharacter: string;
}

export interface WindowParameters {
  id: string;
  x: number;
  y: number;
}

export interface Settings {
  windowParameters?: WindowParameters[];
  isAutoFocusActivate: boolean;
  isOrganizerActive: boolean;
  isContainerHorizontal: boolean;
  autoFocusMode: string;
  shortcuts: Shortcuts;
  [key: string]: any;
}