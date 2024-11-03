import { usePaginatedQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

// The get query in convex/messages.ts handles fetching messages in paginated form.
// This means that when get is called, it only retrieves a limited number of messages, determined by a batch size (BATCH_SIZE).
// The query also returns metadata that indicates whether more data is available to fetch.

const BATCH_SIZE = 20;

interface UseGetMessagesProps {
  channelId?: Id<"channels">;
  conversationId?: Id<"conversations">;
  parentMessageId?: Id<"messages">;
}

export type GetMessagesReturnType =
  (typeof api.messages.get._returnType)["page"];

export const useGetMessages = ({
  channelId,
  conversationId,
  parentMessageId,
}: UseGetMessagesProps) => {
  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.get,
    { channelId, conversationId, parentMessageId },
    { initialNumItems: BATCH_SIZE }
  );

  return { results, status, loadMore: () => loadMore(BATCH_SIZE) };
};

// In the MessageList component, these values are used to manage the infinite loading behavior:

// loadMore:

// This function is called to load the next batch of messages when the user scrolls to the end of the current list.
// Each time loadMore is called, the usePaginatedQuery hook triggers a new request to fetch the next BATCH_SIZE messages from the get query.
// isLoadingMore:

// This is derived from the status returned by usePaginatedQuery.
// It indicates whether the loadMore function is currently fetching the next batch of messages.
// In the UI, isLoadingMore can be used to show a loading indicator, so the user knows that more messages are being loaded.
// canLoadMore:

// This value indicates whether there are more messages available to load, based on the response from the get query.
// If there are no more messages to load (e.g., the end of the chat history has been reached), canLoadMore will be false, and the loadMore button or infinite scroll trigger can be disabled.
