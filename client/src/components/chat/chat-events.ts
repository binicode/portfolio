/** Lets any button on the page open the assistant without importing it. */
export const OPEN_CHAT_EVENT = 'assistant:open';

/** Chat answers questions; discovery plans a project with the visitor. */
export type AssistantMode = 'chat' | 'discovery';

export interface OpenChatOptions {
  /**
   * Discovery: a project type to preselect on the first question ("Plan a
   * similar project" on a store case study preselects Online store).
   * Ignored when the visitor already has answers in progress.
   */
  build?: string;
  /**
   * Chat: a question to put in the message box, ready to send ("Ask how it
   * was built"). Never sent automatically; the visitor presses Send.
   */
  question?: string;
}

export interface OpenChatDetail extends OpenChatOptions {
  mode?: AssistantMode;
}

export function requestOpenChat(mode?: AssistantMode, options: OpenChatOptions = {}): void {
  window.dispatchEvent(new CustomEvent<OpenChatDetail>(OPEN_CHAT_EVENT, { detail: { mode, ...options } }));
}
