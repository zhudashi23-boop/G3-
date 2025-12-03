import { GoogleGenAI, Type } from "@google/genai";
import { Snippet, MindMapNode } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please ensure process.env.API_KEY is set.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateKnowledgeMap = async (
  snippets: Snippet[]
): Promise<MindMapNode> => {
  if (snippets.length === 0) {
    throw new Error("No snippets to organize.");
  }

  const ai = getClient();
  
  // Prepare input text
  const notesText = snippets.map((s, index) => `
    [Note ${index + 1}] (Created: ${new Date(s.createdAt).toLocaleDateString()}) (Tags: ${s.tags.join(', ')})
    ${s.content}
  `).join('\n\n----------------\n\n');

  const prompt = `
    你是一位顶级的知识管理专家。我有一堆杂乱的笔记碎片。
    请帮我整理这些内容，构建一个逻辑清晰的“思维导图”结构。

    要求：
    1.  **根节点**是“我的知识库”。
    2.  分析所有笔记的内容，归纳出几个**一级主题**（Parent Nodes）。
    3.  在每个一级主题下，根据细节进一步细分出**二级主题**或**具体知识点**。
    4.  **重要**：对于每个节点，提供一个 brief 'label' (标题) 和一个 detailed 'description' (详细总结)。
    5.  Description 应该是对归纳到该节点下的所有笔记内容的**综合阐述**。不要丢失重要细节。如果笔记中有代码片段或关键数据，请在 description 中体现。
    6.  结构不要太深，最多 3-4 层。

    请返回符合以下 JSON Schema 的数据：
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt + "\n\n" + notesText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            label: { type: Type.STRING },
            description: { type: Type.STRING },
            children: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                   id: { type: Type.STRING },
                   label: { type: Type.STRING },
                   description: { type: Type.STRING },
                   children: {
                     type: Type.ARRAY,
                     items: {
                       type: Type.OBJECT, // Recursion is tricky in strict schema, keeping it simple to 3 levels structure explicitly if needed, but 'OBJECT' usually allows nesting in practice for Gemini 1.5+
                       properties: {
                          id: { type: Type.STRING },
                          label: { type: Type.STRING },
                          description: { type: Type.STRING },
                          children: {
                            type: Type.ARRAY,
                            items: { type: Type.OBJECT } // Leaf
                          }
                       }
                     }
                   }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      // Ensure root has an ID if missing
      if (!data.id) data.id = 'root';
      return data;
    }
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("Error generating mind map:", error);
    throw new Error("AI 整理失败，请稍后再试。");
  }
};