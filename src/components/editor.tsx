import Quill, { type QuillOptions } from "quill";
import { PiTextAa } from "react-icons/pi";
import { MdSend } from "react-icons/md";
import {
  MutableRefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "./ui/button";
import { ImageIcon, Smile, XIcon } from "lucide-react";
import { Hint } from "./hint";
import "quill/dist/quill.snow.css";
import { Delta, Op } from "quill/core";
import { cn } from "@/lib/utils";
import { EmojiPopover } from "./emoji-popover";
import Image from "next/image";

type EditorValue = {
  image: File | null;
  body: string;
};

interface EditorProps {
  onSubmit: ({ image, body }: EditorValue) => void;
  onCancel?: () => void;
  placeholder?: string;
  defaultValue?: Delta | Op[];
  disabled?: boolean;
  innerRef?: MutableRefObject<Quill | null>;
  variant?: "create" | "update";
}
// default variant is create. if user doesn't pass a variant, it will be create
export const Editor = ({
  onCancel,
  onSubmit,
  placeholder = "Write something...",
  defaultValue = [],
  disabled = false,
  innerRef,
  variant = "create",
}: EditorProps) => {
  // for disabling the submit  button, if there is no text
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  //  Refs do not have to be included in the dependency array and do not cause retender of the useEffect.
  // Store all the values into their own refs  -> this way we can call them inside of useEffect.
  const submitRef = useRef(onSubmit);
  const placeholderRef = useRef(placeholder);
  const quillRef = useRef<Quill | null>(null);
  const defaultValueRef = useRef(defaultValue);
  const disabledRef = useRef(disabled);
  const imageElementRef = useRef<HTMLInputElement | null>(null);

  useLayoutEffect(() => {
    submitRef.current = onSubmit;
    placeholderRef.current = placeholder;
    defaultValueRef.current = defaultValue;
    disabledRef.current = disabled;
  });

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const container = containerRef.current;

    const editorContainer = container.appendChild(
      container.ownerDocument.createElement("div")
    );

    const options: QuillOptions = {
      theme: "snow",
      placeholder: placeholderRef.current,
      // Add a new line on shift and return overwrite
      // normal enter does nothing , but shift enter – new line in the options
      // customize toolbar
      modules: {
        toolbar: [
          ["bold", "italic", "strike"],
          ["link"],
          [{ list: "ordered" }, { list: "bullet" }],
        ],
        keyboard: {
          bindings: {
            enter: {
              key: "Enter",
              handler: () => {
                // Submit form:
                const text = quill.getText();
                const addedImage = imageElementRef.current?.files?.[0] || null;
                const isEmpty =
                  !addedImage &&
                  text.replace(/<(.|\n)*?>/g, "").trim().length === 0;
                if (isEmpty) {
                  return;
                }
                const body = JSON.stringify(quill.getContents());
                submitRef.current?.({ body, image: addedImage });
              },
            },
            shift_enter: {
              key: "Enter",
              shiftKey: true,
              handler: () => {
                quill.insertText(quill.getSelection()?.index || 0, "\n");
              },
            },
          },
        },
      },
    };

    const quill = new Quill(editorContainer, options);
    quillRef.current = quill;
    quillRef.current.focus();

    // if we want to control outside of the component, we can attach innerRef.current to quill:
    if (innerRef) {
      innerRef.current = quill;
    }

    //  for disabling the submit  button, if there is no text usiing UseState above:
    quill.setContents(defaultValueRef.current);
    setText(quill.getText());

    // update the quill on each key stroke:
    quill.on(Quill.events.EDITOR_CHANGE, () => {
      setText(quill.getText());
    });

    // a cleanup function that runs when the component unmounts.
    // offload the event change
    return () => {
      quill.off(Quill.events.EDITOR_CHANGE);
      if (container) {
        container.innerHTML = "";
      }
      if (quillRef.current) {
        quillRef.current = null;
      }
      if (innerRef) {
        innerRef.current = null;
      }
    };
  }, [innerRef]);

  // toggle Toolbar
  const toggleToolbar = () => {
    setIsToolbarVisible((current) => !current);
    const toolbarElement = containerRef.current?.querySelector(".ql-toolbar");

    if (toolbarElement) {
      toolbarElement.classList.toggle("hidden");
    }
  };

  // will be updated constantly true or false
  const isEmpty = !image && text.replace(/<(.|\n)*?>/g, "").trim().length === 0;
  // console.log({ isEmpty, text });

  // onEmojiSelect to be passed to the EmojiPopover:
  const onEmojiSelect = (emoji: any) => {
    const quill = quillRef.current;
    // emoji appended to the last position if it exists or the first one:
    quill?.insertText(quill.getSelection()?.index || 0, emoji.native);
  };

  return (
    <div className="flex flex-col">
      <input
        type="file"
        accept="image/*"
        ref={imageElementRef}
        onChange={(event) => setImage(event.target.files![0])}
        className="hidden"
      />
      <div
        className={cn(
          "flex flex-col border border-slate-200 rounded-md overflow-hidden focus-within:border-slate-300 focus-within:shadow-sm transition bg-white",
          disabled && "opacity-50"
        )}
      >
        <div ref={containerRef} className="h-full ql-custom" />
        {!!image && (
          <div className="p-2">
            <div className="relative size-[62px] flex items-center justify-center group/image">
              <Hint label="Remove image">
                <button
                  onClick={() => {
                    setImage(null);
                    imageElementRef.current!.value = "";
                  }}
                  className="hidden group-hover/image:flex rounded-full bg-black/70 hover:bg-black absolute -top-2.5 -right-2.5 text-white size-6 z-[4] border-2 border-white items-center justify-center"
                >
                  <XIcon className="size-3.5" />
                </button>
              </Hint>
              <Image
                src={URL.createObjectURL(image)}
                alt="Uploaded"
                fill
                className="rounded-xl overflow-hidden border object-cover"
              />
            </div>
          </div>
        )}
        <div className="flex px-2 pb-2 z-[5]">
          <Hint
            label={isToolbarVisible ? "Hide formatting" : "Show formatting"}
          >
            <Button
              disabled={disabled}
              size="iconSm"
              variant="ghost"
              onClick={toggleToolbar}
            >
              <PiTextAa className="size-4" />
            </Button>
          </Hint>
          <EmojiPopover onEmojiSelect={onEmojiSelect}>
            <Button
              disabled={disabled}
              size="iconSm"
              variant="ghost"
              // onClick={() => {}}
            >
              <Smile className="size-4" />
            </Button>
          </EmojiPopover>
          {variant === "create" && (
            <Hint label="Image">
              <Button
                disabled={disabled}
                size="iconSm"
                variant="ghost"
                onClick={() => imageElementRef.current?.click()}
              >
                <ImageIcon className="size-4" />
              </Button>
            </Hint>
          )}
          {variant === "update" && (
            <div className="ml-auto flex items-center gap-x-2">
              <Button
                disabled={disabled}
                size="sm"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                disabled={disabled || isEmpty}
                onClick={() => {
                  onSubmit({
                    body: JSON.stringify(quillRef.current?.getContents()),
                    image,
                  });
                }}
                size="sm"
                className="bg-[#007a5a] hover:bg-[#007a5a]/80 text-white"
              >
                Save
              </Button>
            </div>
          )}

          {variant === "create" && (
            <Button
              disabled={disabled || isEmpty}
              onClick={() => {
                onSubmit({
                  body: JSON.stringify(quillRef.current?.getContents()),
                  image,
                });
              }}
              size="iconSm"
              className={cn(
                "ml-auto",
                isEmpty
                  ? "bg-white hover:bg-white text-muted-foreground"
                  : "bg-[#007a5a] hover:bg-[#007a5a]/80  text-white"
              )}
            >
              <MdSend className="size-4" />
            </Button>
          )}
        </div>
      </div>
      {variant === "create" && (
        <div
          className={cn(
            "p-2 text-[10px] text-muted-foreground flex justify-end opacity-0 transition",
            !isEmpty && "opacity-100"
          )}
        >
          <p>
            <strong>Shift + Return</strong> to add a new line
          </p>
        </div>
      )}
    </div>
  );
};
