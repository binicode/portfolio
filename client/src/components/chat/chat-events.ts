/** Lets any button on the page open the assistant without importing it. */
export const OPEN_CHAT_EVENT = 'assistant:open';

export function requestOpenChat(): void {
  window.dispatchEvent(new Event(OPEN_CHAT_EVENT));
}
