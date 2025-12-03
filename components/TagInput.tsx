import React, { useState, KeyboardEvent } from 'react';
import { X, Plus, Hash } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export const TagInput: React.FC<TagInputProps> = ({ tags, onChange }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 mb-1">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-cyan-100 text-cyan-800 border border-cyan-200">
            <Hash size={10} className="mr-1 opacity-50"/>
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1.5 hover:text-cyan-900 focus:outline-none"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-transparent transition-all shadow-sm">
        <Hash size={16} className="text-slate-400" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="添加标签..."
          className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={addTag}
          disabled={!input.trim()}
          className="text-slate-400 hover:text-cyan-600 disabled:opacity-30 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
};