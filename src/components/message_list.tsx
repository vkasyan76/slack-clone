import { GetMessagesReturnType } from "@/features/messages/api/use-get-messages";
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";
import { Message } from "./message";
import { ChannelHero } from "./channel-hero";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { Loader } from "lucide-react";
import { ConversationHero } from "./conversation-hero";

// number of minutes for messages to be considered compact. Agter which fall back to non-compact.
const TIME_THRESHOLD = 5;

interface MessageListProps {
  memberName?: string;
  memberImage?: string;
  channelName?: string;
  channelCreationTime?: number;
  variant?: "channel" | "thread" | "conversation";
  data: GetMessagesReturnType | undefined;
  loadMore: () => void;
  isLoadingMore: boolean;
  canLoadMore: boolean;
}

// Utility function for formatting date labels
const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
};

export const MessageList = ({
  memberName,
  memberImage,
  channelName,
  channelCreationTime,
  variant = "channel",
  data,
  loadMore,
  isLoadingMore,
  canLoadMore,
}: MessageListProps) => {
  const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);

  const workspaceId = useWorkspaceId();

  const { data: currentMember } = useCurrentMember({ workspaceId });

  // Group messages by date:
  //   In .reduce(), the second argument passed is the initial value of the accumulator.
  // In this case, we’re setting the initial value of groups (the accumulator) to an empty object ({}) => as Record<string, typeof data>
  const groupedMessages = data?.reduce(
    (groups, message) => {
      const date = new Date(message._creationTime);
      const dateKey = format(date, "yyyy-MM-dd");

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].unshift(message);

      return groups;
    },
    {} as Record<string, typeof data>
  );

  // Object.entries() is a JavaScript method that takes an object and returns an array of its key-value pairs,
  // where each key-value pair is represented as a two-element array [key, value].
  // The || {} part ensures that if groupedMessages is undefined (e.g., if data is undefined), it defaults to an empty object {}.
  // After converting groupedMessages to an array of entries, we use .map() to iterate over each entry.

  return (
    <div className="flex-1 flex flex-col-reverse pb-4 overflow-y-auto messages-scrollbar">
      {/* {data?.map((message) => <div>{JSON.stringify(message)}</div>)} */}
      {Object.entries(groupedMessages || {}).map(([dateKey, messages]) => (
        <div key={dateKey}>
          <div className="text-center my-2 relative">
            <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
            <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
              {formatDateLabel(dateKey)}
            </span>
          </div>
          {messages.map((message, index) => {
            // return <div key={message._id}>{JSON.stringify(message)}</div>;
            const prevMessage = messages[index - 1];
            const isCompact =
              prevMessage &&
              prevMessage.user?._id === message.user._id &&
              differenceInMinutes(
                new Date(message._creationTime),
                new Date(prevMessage._creationTime)
              ) < TIME_THRESHOLD;
            return (
              <Message
                key={message._id}
                id={message._id}
                memberId={message.memberId}
                authorImage={message.user.image}
                authorName={message.user.name}
                isAuthor={message.memberId === currentMember?._id} // if messege member id is current member than he is the author
                reactions={message.reactions}
                body={message.body}
                image={message.image}
                updatedAt={message.updatedAt}
                createdAt={message._creationTime}
                isEditing={editingId === message._id} // editing when we are in the message id
                setEditingId={setEditingId} // set the editing id to the current message id
                isCompact={isCompact}
                hideThreadButton={variant === "thread"} // Hide thread button if in thread view: if we are in a thread no possibility to reply on a reply
                threadCount={message.threadCount}
                threadImage={message.threadImage}
                threadName={message.threadName}
                threadTimestamp={message.threadTimestamp}
              />
            );
          })}
        </div>
      ))}
      {/* <div>
        <button onClick={loadMore}>Load More</button>
      </div> */}
      {/* The ref attribute on this element attaches an Intersection Observer to it. The observer watches for when this element enters the viewport. */}
      {/* In the ref callback, el is either null (when the component first mounts)  or the actual DOM node for the div. */}
      <div
        className="h-1"
        ref={(el) => {
          if (el) {
            const observer = new IntersectionObserver(
              // [entry] simplifies grabbing the first entry in the entries array.
              // The callback function checks if canLoadMore is true and, if so, calls loadMore().
              ([entry]) => {
                if (entry.isIntersecting && canLoadMore) {
                  loadMore();
                }
              },
              { threshold: 1.0 }
              // hreshold of 1.0 means that the callback will trigger only when 100% of the element is visible within the viewport
            );
            observer.observe(el);
            return () => observer.disconnect();
          }
        }}
      />
      {isLoadingMore && (
        <div className="text-center my-2 relative">
          <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
          <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
            <Loader className="size-4 animate-spin" />
          </span>
        </div>
      )}
      {variant === "channel" && channelName && channelCreationTime && (
        <ChannelHero name={channelName} creationTime={channelCreationTime} />
      )}
      {variant === "conversation" && (
        <ConversationHero name={memberName} image={memberImage} />
      )}
    </div>
  );
};
