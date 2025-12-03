import { Snippet, MindMapData } from '../types';

const SNIPPETS_KEY = 'zen_knowledge_snippets';
const MINDMAP_KEY = 'zen_knowledge_mindmap';

export const saveSnippet = (snippet: Snippet): void => {
  const snippets = getSnippets();
  const index = snippets.findIndex(s => s.id === snippet.id);
  if (index >= 0) {
    snippets[index] = snippet;
  } else {
    snippets.push(snippet);
  }
  // Sort by updated time descending
  snippets.sort((a, b) => b.updatedAt - a.updatedAt);
  localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
};

export const getSnippets = (): Snippet[] => {
  const data = localStorage.getItem(SNIPPETS_KEY);
  return data ? JSON.parse(data) : [];
};

export const deleteSnippet = (id: string): void => {
  const snippets = getSnippets().filter(s => s.id !== id);
  localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
};

export const saveMindMap = (mapData: MindMapData): void => {
  // We only keep the latest mind map for simplicity in this version
  localStorage.setItem(MINDMAP_KEY, JSON.stringify(mapData));
};

export const getMindMap = (): MindMapData | null => {
  const data = localStorage.getItem(MINDMAP_KEY);
  return data ? JSON.parse(data) : null;
};

// Clear all data (debug purpose)
export const clearAllData = () => {
  localStorage.removeItem(SNIPPETS_KEY);
  localStorage.removeItem(MINDMAP_KEY);
};