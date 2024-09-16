"use client";

import { UserButton } from "@/features/auth/components/user-button";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useCreateWorkspaceModal } from "@/features/workspaces/store/use-create-workspace-modal";
import { useEffect, useMemo } from "react";

export default function Home() {
  const { data, isLoading } = useGetWorkspaces();

  // its a global state will be become true whenever we add this hook:
  const [open, setOpen] = useCreateWorkspaceModal();

  const workspaceId = useMemo(() => data?.[0]?._id, [data]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (workspaceId) {
      console.log("Redirect to workspace", workspaceId);
    } else if (!open) {
      // console.log("Open creation modal");
      setOpen(true);
    }
  }, [workspaceId, isLoading, open, setOpen]);

  return (
    <div className="">
      <UserButton />
    </div>
  );
}
