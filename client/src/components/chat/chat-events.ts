/** Lets any button on the page open the assistant without importing it. */
export const OPEN_CHAT_EVENT = 'assistant:open';

/** Chat answers questions; discovery plans a project with the visitor. */
export type AssistantMode = 'chat' | 'discovery';

export function requestOpenChat(mode?: AssistantMode): void {
  window.dispatchEvent(new CustomEvent<{ mode?: AssistantMode }>(OPEN_CHAT_EVENT, { detail: { mode } }));
}
