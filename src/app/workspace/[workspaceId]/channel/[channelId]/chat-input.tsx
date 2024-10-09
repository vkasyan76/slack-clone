import dynamic from "next/dynamic";
import Quill from "quill";
import { useRef } from "react";
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

  return (
    <div className="px-5 w-full">
      <Editor
        placeholder={placeholder}
        onSubmit={() => {}}
        disabled={false}
        innerRef={editorRef}
        variant="create"
      />
    </div>
  );
};
