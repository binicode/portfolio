export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface ChatHistoryResponse {
  sessionId: string;
  messages: ChatMessage[];
}

export type KnowledgeSourceType = 'bio' | 'project' | 'case-study';

export interface RetrievedSource {
  sourceTitle: string;
  sourceType: KnowledgeSourceType;
}

export interface ChatCompletionUsage {
  inputTokens: number;
  outputTokens: number;
}

export type ChatStreamEvent =
  | { type: 'token'; content: string }
  | { type: 'done'; usage: ChatCompletionUsage; retrievedSources: RetrievedSource[] }
  | { type: 'error'; message: string };