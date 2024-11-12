"use client";

import { useCreateOrGetConversation } from "@/features/conversations/api/use-create-or-get-conversation";
import { Id } from "../../../../../../convex/_generated/dataModel";
// import { Doc } from "../../../../../../convex/_generated/dataModel";
import { useMemberId } from "@/hooks/use-member-id";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { AlertTriangle, Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Conversation } from "./conversation";

// memberOneId is derived from the currently authenticated user’s userId within the workspace.
// memberTwoId is obtained from the URL parameter memberId (extracted by useMemberId in page.tsx).

const MemberIdPage = () => {
  const workspaceId = useWorkspaceId();
  const memberId = useMemberId();

  // The issue here seems to stem from the condition that checks for !data in your component.
  // Your useCreateOrGetConversation hook sets the data state,
  // but because the data value is not directly assigned in the onSuccess callback of the mutate function,
  // data remains null in the component.

  // To resolve this, ensure that the data state in your component updates after mutate completes.
  // You can achieve this by setting the data state within the onSuccess callback or by adding a loading indicator until data is set.

  // Solution from ChatGPT:
  // const [data, setData] = useState<Doc<"conversations"> | null>(null);

  // Solution from Antonio using Id<"conversations">:
  // Simplified Data Handling: By only returning the conversationId instead of the entire conversation document, the mutation becomes more focused.

  const [conversationId, setConversationId] =
    useState<Id<"conversations"> | null>(null);

  //  the data itself is obtained directly in the onSuccess callback of the mutate function. No need to import it from the hook.
  const { mutate, isPending } = useCreateOrGetConversation();

  useEffect(() => {
    mutate(
      { workspaceId, memberId },
      {
        onSuccess: (data) => {
          console.log("Conversation created", data);
          // setData(data);
          setConversationId(data);
        },
        onError: () => {
          // console.error("Error creating or getting conversation ", error);
          toast.error("Error creating or getting conversation");
        },
      }
    );
  }, [workspaceId, memberId, mutate]);

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="animate-spin size-5 text-muted-foreground" />
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="flex flex-col gap-y-2 h-full items-center justify-center">
        <AlertTriangle className="size-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Conversation not found
        </span>
      </div>
    );
  }

  return (
    // <div>
    //   {/* {JSON.stringify({ workspaceId, memberId })} */}
    //   {/* {JSON.stringify(data)} */}
    //   {/* {JSON.stringify(conversationId)} */}
    // </div>

    <Conversation id={conversationId} />
  );
};

export default MemberIdPage;
