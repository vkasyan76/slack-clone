import { useCreateMessage } from "@/features/messages/api/use-create-message";
import { useChannelId } from "@/hooks/use-channel-id";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import dynamic from "next/dynamic";
import Quill from "quill";
import { useRef, useState } from "react";
import { toast } from "sonner";
// import { Editor } from "@/components/editor";
// const Editor = dynamic(() => import("@/components/editor"), { ssr: false });

// need to explicitly reference the default export of the module:

const Editor = dynamic(
  () => import("@/components/editor").then((mod) => mod.Editor),
  { ssr: false }
);

interface ChatInputProps {
  placeholder: string;
}

export const ChatInput = ({ placeholder }: ChatInputProps) => {
  // in order to control the Editor outside of the component (e.g after we sent the message, we want to clear the editor):
  const editorRef = useRef<Quill | null>(null);
  const workspaceId = useWorkspaceId();
  const channelId = useChannelId();
  const { mutate: createMessage } = useCreateMessage();

  // Everytime the key changes – editor component will be destroyed and rebuilt. Forced rerendering.
  const [editorKey, setEditorKey] = useState<number>(0);
  // We will need to do some API calls inside the handleSubmit:
  const [isPending, setIsPending] = useState(false);

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
      await createMessage(
        {
          workspaceId,
          channelId,
          body,
        },
        { throwError: true }
        // the function does not throw an error by default, any issues during message creation might not be caught
      );
      // Everytime the key changes – editor component will be destroyed and rebuilt. Forced rerendering.
      setEditorKey((prev) => prev + 1);
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="px-5 w-full">
      <Editor
        key={editorKey}
        placeholder={placeholder}
        onSubmit={handleSubmit}
        disabled={isPending}
        innerRef={editorRef}
        variant="create"
      />
    </div>
  );
};
