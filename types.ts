export interface Snippet {
  id: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface MindMapNode {
  id: string;
  label: string;
  description: string; // Detailed summary or synthesis
  children?: MindMapNode[];
  color?: string; // UI hint
}

export interface MindMapData {
  id: string;
  root: MindMapNode;
  createdAt: number;
  snippetCount: number;
}

export enum ViewMode {
  CAPTURE = 'CAPTURE',
  LIBRARY = 'LIBRARY',
  MINDMAP = 'MINDMAP',
}

export const THEME_COLORS = {
  primary: 'cyan', // Tailwind colors
  secondary: 'slate',
};