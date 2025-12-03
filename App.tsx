import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Plus, 
  Brain, 
  Library, 
  Search, 
  Trash2, 
  Edit2, 
  ChevronRight, 
  Layers, 
  FileText,
  Clock,
  LayoutGrid,
  Sparkles,
  X
} from 'lucide-react';

import { Snippet, MindMapData, MindMapNode, ViewMode } from './types';
import { getSnippets, saveSnippet, deleteSnippet, saveMindMap, getMindMap } from './services/storageService';
import { generateKnowledgeMap } from './services/geminiService';
import { TagInput } from './components/TagInput';
import { Button } from './components/Button';

// --- Recursive Mind Map Component ---
const MindMapNodeView: React.FC<{ 
  node: MindMapNode; 
  depth: number; 
  onSelect: (node: MindMapNode) => void;
  isLastChild?: boolean;
}> = ({ node, depth, onSelect, isLastChild }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col relative pl-6">
      {/* Visual connector lines (simplified) */}
      {depth > 0 && (
         <div className="absolute left-0 top-4 w-6 h-px bg-slate-300"></div>
      )}
      {depth > 0 && !isLastChild && (
         <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-300"></div>
      )}
      {depth > 0 && isLastChild && (
         <div className="absolute left-0 top-0 h-4 w-px bg-slate-300"></div>
      )}

      <div className="flex items-center gap-2 mb-2 group">
        <button 
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
          className={`w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 transition-colors ${hasChildren ? 'text-slate-500' : 'invisible'}`}
        >
          <ChevronRight size={14} className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>

        <div 
          onClick={() => onSelect(node)}
          className={`
            cursor-pointer px-3 py-1.5 rounded-lg border shadow-sm transition-all flex items-center gap-2
            ${depth === 0 ? 'bg-cyan-600 text-white border-cyan-700 hover:bg-cyan-700' : ''}
            ${depth === 1 ? 'bg-white text-slate-800 border-slate-200 hover:border-cyan-400 hover:shadow-md' : ''}
            ${depth > 1 ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-cyan-300 text-sm' : ''}
          `}
        >
          {depth === 0 && <Brain size={16} />}
          {depth > 0 && <div className={`w-2 h-2 rounded-full ${hasChildren ? 'bg-cyan-400' : 'bg-slate-300'}`}></div>}
          <span className="font-medium">{node.label}</span>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="flex flex-col border-l-2 border-slate-100/50 ml-3 pl-2">
          {node.children!.map((child, idx) => (
            <MindMapNodeView 
              key={child.id || idx} 
              node={child} 
              depth={depth + 1} 
              onSelect={onSelect}
              isLastChild={idx === node.children!.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [view, setView] = useState<ViewMode>(ViewMode.CAPTURE);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [mindMap, setMindMap] = useState<MindMapData | null>(null);
  
  // Edit/Capture State
  const [editorContent, setEditorContent] = useState('');
  const [editorTags, setEditorTags] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Mind Map UI State
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSnippets(getSnippets());
    setMindMap(getMindMap());
  }, []);

  // --- Actions ---

  const handleSaveSnippet = () => {
    if (!editorContent.trim()) return;

    const newSnippet: Snippet = {
      id: editingId || crypto.randomUUID(),
      content: editorContent,
      tags: editorTags,
      createdAt: editingId ? (snippets.find(s => s.id === editingId)?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now()
    };

    saveSnippet(newSnippet);
    setSnippets(getSnippets());
    resetEditor();
    
    // Auto-switch to library if we were editing
    if (editingId) setView(ViewMode.LIBRARY);
  };

  const resetEditor = () => {
    setEditorContent('');
    setEditorTags([]);
    setEditingId(null);
  };

  const startEdit = (snippet: Snippet) => {
    setEditingId(snippet.id);
    setEditorContent(snippet.content);
    setEditorTags(snippet.tags);
    setView(ViewMode.CAPTURE);
  };

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这条笔记吗？")) {
      deleteSnippet(id);
      setSnippets(getSnippets());
    }
  };

  const handleGenerateMindMap = async () => {
    if (snippets.length === 0) {
      alert("知识库为空，请先添加一些笔记。");
      return;
    }
    
    setIsGenerating(true);
    try {
      const rootNode = await generateKnowledgeMap(snippets);
      const newMap: MindMapData = {
        id: crypto.randomUUID(),
        root: rootNode,
        createdAt: Date.now(),
        snippetCount: snippets.length
      };
      
      saveMindMap(newMap);
      setMindMap(newMap);
      setSelectedNode(rootNode); // Open root by default
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Views ---

  const renderSidebar = () => (
    <aside className="w-full md:w-20 lg:w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed md:sticky top-0 z-20 shadow-xl">
      <div className="p-4 md:p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-white shrink-0">
          <Layers size={20} />
        </div>
        <span className="font-bold text-white text-lg hidden lg:block tracking-tight">KnowledgeOS</span>
      </div>
      
      <nav className="flex-1 p-2 md:p-4 space-y-2 overflow-y-auto">
        <button 
          onClick={() => setView(ViewMode.CAPTURE)}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${view === ViewMode.CAPTURE ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          title="碎片记录"
        >
          <Plus size={20} /> <span className="hidden lg:block">快速记录</span>
        </button>
        <button 
          onClick={() => setView(ViewMode.LIBRARY)}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${view === ViewMode.LIBRARY ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          title="知识库"
        >
          <Library size={20} /> <span className="hidden lg:block">知识库</span>
        </button>
        <button 
          onClick={() => setView(ViewMode.MINDMAP)}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${view === ViewMode.MINDMAP ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          title="思维导图"
        >
          <Brain size={20} /> <span className="hidden lg:block">思维导图</span>
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800 hidden lg:block">
        <div className="text-xs text-slate-500">
          <p>已存储 {snippets.length} 条笔记</p>
          <p className="mt-1">上次整理: {mindMap ? new Date(mindMap.createdAt).toLocaleDateString() : '从未'}</p>
        </div>
      </div>
    </aside>
  );

  const renderCaptureView = () => (
    <div className="max-w-3xl mx-auto p-6 lg:p-12 animate-fade-in w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 font-mono">{editingId ? '编辑笔记' : '碎片记录'}</h1>
        <p className="text-slate-500">捕捉稍纵即逝的灵感，或粘贴半成品的段落。</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <TagInput tags={editorTags} onChange={setEditorTags} />
        
        <div className="relative">
          <textarea
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            placeholder="在这里输入内容..."
            className="w-full h-80 p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-cyan-500 focus:bg-white outline-none text-slate-700 leading-relaxed font-mono text-sm"
          ></textarea>
          <div className="absolute bottom-4 right-4 text-xs text-slate-400">
            {editorContent.length} 字
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock size={12} /> 自动保存到本地缓存
          </span>
          <div className="flex gap-3">
             {editingId && (
               <Button variant="ghost" onClick={resetEditor}>取消</Button>
             )}
             <Button onClick={handleSaveSnippet}>
               {editingId ? '更新' : '保存'}
             </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLibraryView = () => {
    const filtered = snippets.filter(s => 
      s.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
      <div className="max-w-5xl mx-auto p-6 animate-fade-in w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1 font-mono">知识库</h1>
            <p className="text-slate-500 text-sm">共 {snippets.length} 条碎片</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="搜索关键词或标签..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-500">没有找到相关笔记</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {filtered.map(s => (
              <div key={s.id} className="break-inside-avoid bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group relative">
                <div className="flex flex-wrap gap-2 mb-3">
                  {s.tags.map(t => (
                    <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">#{t}</span>
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap max-h-60 overflow-hidden relative">
                  {s.content}
                  {s.content.length > 200 && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"></div>
                  )}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400">
                  <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(s)} className="hover:text-cyan-600"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(s.id)} className="hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMindMapView = () => (
    <div className="flex h-screen overflow-hidden w-full relative">
      {/* Main Canvas */}
      <div className="flex-1 bg-slate-50 p-8 overflow-auto relative">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <LayoutGrid className="text-cyan-600"/> 知识图谱
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {mindMap ? `上次整理于: ${new Date(mindMap.createdAt).toLocaleString()}` : '尚未生成图谱'}
            </p>
          </div>
          <Button onClick={handleGenerateMindMap} isLoading={isGenerating}>
            <Sparkles size={16} className="mr-2" />
            {mindMap ? '重新整理' : '生成图谱'}
          </Button>
        </div>

        {!mindMap ? (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <Brain size={64} className="mb-4 text-slate-300" />
            <p>点击上方按钮，AI 将为你自动梳理知识结构</p>
          </div>
        ) : (
          <div className="pb-40 pl-4">
             <MindMapNodeView 
                node={mindMap.root} 
                depth={0} 
                onSelect={setSelectedNode} 
              />
          </div>
        )}
      </div>

      {/* Slide-over Detail Panel */}
      {selectedNode && (
        <div className="w-96 bg-white shadow-2xl border-l border-slate-200 z-30 flex flex-col h-full absolute right-0 top-0 animate-fade-in">
          <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
             <div>
               <h2 className="text-xl font-bold text-slate-800 leading-tight">{selectedNode.label}</h2>
               <span className="text-xs text-slate-500 mt-1 inline-block bg-white px-2 py-0.5 rounded border border-slate-200">
                 ID: {selectedNode.id.substring(0, 8)}
               </span>
             </div>
             <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600">
               <X size={20} />
             </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 prose prose-slate prose-sm max-w-none">
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">AI 综述</h3>
            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-100 text-slate-700 mb-6">
              <ReactMarkdown>{selectedNode.description || '暂无详细描述'}</ReactMarkdown>
            </div>

            {selectedNode.children && selectedNode.children.length > 0 && (
              <>
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">包含主题</h3>
                <ul className="space-y-2">
                  {selectedNode.children.map(child => (
                    <li 
                      key={child.id} 
                      className="cursor-pointer hover:text-cyan-600 hover:underline flex items-center gap-2"
                      onClick={() => setSelectedNode(child)}
                    >
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                      {child.label}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col md:flex-row font-sans text-slate-900">
      {renderSidebar()}
      <main className="flex-1 md:ml-0 h-screen overflow-auto relative">
        {view === ViewMode.CAPTURE && renderCaptureView()}
        {view === ViewMode.LIBRARY && renderLibraryView()}
        {view === ViewMode.MINDMAP && renderMindMapView()}
      </main>
    </div>
  );
}