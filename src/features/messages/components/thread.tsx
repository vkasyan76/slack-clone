import { AlertTriangle, Loader, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Id } from "../../../../convex/_generated/dataModel";
import { useGetMessage } from "../api/use-get-message";
import { Message } from "@/components/message";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useRef, useState } from "react";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import dynamic from "next/dynamic";
import Quill from "quill";
import { toast } from "sonner";
import { useChannelId } from "@/hooks/use-channel-id";
import { useCreateMessage } from "../api/use-create-message";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";
import { useGetMessages } from "../api/use-get-messages";
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";

const Editor = dynamic(
  () => import("@/components/editor").then((mod) => mod.Editor),
  { ssr: false }
);

const TIME_THRESHOLD = 5;

interface ThreadProps {
  messageId: Id<"messages">;
  onClose: () => void;
}

type CreateMessageValues = {
  channelId: Id<"channels">;
  workspaceId: Id<"workspaces">;
  parentMessageId: Id<"messages">;
  body: string;
  image: Id<"_storage"> | undefined;
};

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
};

export const Thread = ({ messageId, onClose }: ThreadProps) => {
  const workspaceId = useWorkspaceId();
  const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);

  const { data: currentMember } = useCurrentMember({ workspaceId });

  const { data: message, isLoading: loadingMessage } = useGetMessage({
    id: messageId,
  });

  // Editor:

  const channelId = useChannelId();

  const editorRef = useRef<Quill | null>(null);

  // Everytime the key changes – editor component will be destroyed and rebuilt. Forced rerendering.
  const [editorKey, setEditorKey] = useState<number>(0);
  // We will need to do some API calls inside the handleSubmit:
  const [isPending, setIsPending] = useState(false);

  const { mutate: createMessage } = useCreateMessage();
  const { mutate: generateUploadUrl } = useGenerateUploadUrl();

  // Create a separate message Messages list for Thread:

  const { results, status, loadMore } = useGetMessages({
    channelId,
    parentMessageId: messageId,
  });

  const canLoadMore = status === "CanLoadMore";
  const isLoadingMore = status === "LoadingMore";

  const groupedMessages = results?.reduce(
    (groups, message) => {
      const date = new Date(message._creationTime);
      const dateKey = format(date, "yyyy-MM-dd");

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].unshift(message);

      return groups;
    },
    {} as Record<string, typeof results>
  );

  // handle submit for Editor

  const handleSubmit = async ({
    body,
    image,
  }: {
    body: string;
    image: File | null;
  }) => {
    // console.log({ body, image });
    try {
      setIsPending(true);
      editorRef.current?.enable(false);

      const values: CreateMessageValues = {
        channelId,
        workspaceId,
        parentMessageId: messageId,
        body,
        image: undefined,
      };

      if (image) {
        const url = await generateUploadUrl({}, { throwError: true });

        console.log("url", { url });

        if (!url) {
          throw new Error("Failed to generate upload url");
        }

        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": image.type },
          body: image,
        });

        console.log("result", { result });

        if (!result.ok) {
          throw new Error("Failed to upload image");
        }

        const { storageId } = await result.json();
        values.image = storageId;
      }

      await createMessage(
        values,
        { throwError: true }
        // the function does not throw an error by default, any issues during message creation might not be caught
      );
      // Everytime the key changes – editor component will be destroyed and rebuilt. Forced rerendering.
      setEditorKey((prev) => prev + 1);
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsPending(false);
      editorRef.current?.enable(true);
    }
  };

  if (loadingMessage || status === "LoadingFirstPage") {
    return (
      <div className="h-full flex flex-col">
        <div className="h-[49px] flex justify-between items-center px-4 border-b">
          <p className="text-lg font-bold">Thread</p>
          <Button variant="ghost" size="iconSm" onClick={onClose}>
            <XIcon className="size-5 stroke-[1.5]" />
          </Button>
        </div>
        <div className="flex flex-col gap-y-2 h-full items-center justify-center">
          <Loader className="animate-spin size-5 text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="h-full flex flex-col">
        <div className="h-[49px] flex justify-between items-center px-4 border-b">
          <p className="text-lg font-bold">Thread</p>
          <Button variant="ghost" size="iconSm" onClick={onClose}>
            <XIcon className="size-5 stroke-[1.5]" />
          </Button>
        </div>
        <div className="flex flex-col gap-y-2 h-full items-center justify-center">
          <AlertTriangle className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Message not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="h-[49px] flex justify-between items-center px-4 border-b">
        <p className="text-lg font-bold">Thread</p>
        <Button variant="ghost" size="iconSm" onClick={onClose}>
          <XIcon className="size-5 stroke-[1.5]" />
        </Button>
      </div>
      <div className="flex-1 flex flex-col-reverse pb-4 overflow-y-auto messages-scrollbar ">
        {Object.entries(groupedMessages || {}).map(([dateKey, messages]) => (
          <div key={dateKey}>
            <div className="text-center my-2 relative">
              <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
              <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
                {formatDateLabel(dateKey)}
              </span>
            </div>
            {messages.map((message, index) => {
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
                  hideThreadButton // Hide thread button if in thread view: if we are in a thread no possibility to reply on a reply
                  threadCount={message.threadCount}
                  threadImage={message.threadImage}
                  threadName={message.threadName}
                  threadTimestamp={message.threadTimestamp}
                />
              );
            })}
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
          </div>
        ))}
        {/* <div>
          <button onClick={loadMore}>Load More</button>

        {/* {JSON.stringify(message)} */}
        <Message
          //   key={message._id}
          hideThreadButton
          id={message._id}
          memberId={message.memberId}
          authorImage={message.user.image}
          authorName={message.user.name}
          isAuthor={message.memberId === currentMember?._id} // if messege member id is current member than he is the author: ={message.memberId === currentMember?._id}
          reactions={message.reactions}
          body={message.body}
          image={message.image}
          updatedAt={message.updatedAt}
          createdAt={message._creationTime}
          isEditing={editingId === message._id} // editing when we are in the message id// Hide thread button if in thread view: if we are in a thread no possibility to reply on a reply: ={editingId === message._id}
          setEditingId={setEditingId} // set the editing id to the current message id: ={setEditingId}
        />
      </div>
      <div className="px-4">
        {/* The key prop is used only by React to control component mounting and unmounting; it’s not meant to be directly accessed within the component itself. */}
        <Editor
          key={editorKey}
          onSubmit={handleSubmit}
          innerRef={editorRef} // const editorRef = useRef<Quill | null>(null);
          disabled={isPending}
          placeholder="Reply..."
        />
      </div>
    </div>
  );
};

// editorKey is used to reset the Editor component by changing the key prop.
// innerRef={editorRef} passes a reference of the Quill instance back to Thread, allowing it to control the editor from outside.
// editorRef.current?.enable(false) and editorRef.current?.enable(true) control the enabled state of the editor, disabling it during message submission to avoid multiple inputs.
