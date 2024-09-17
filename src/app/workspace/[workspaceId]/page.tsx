"use client";

// import { useParams } from "next/navigation";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";

const WorkspaceIdPage = () => {
  // const params = useParams();
  const workspaceId = useWorkspaceId();
  const { data } = useGetWorkspace({ id: workspaceId });

  return (
    // <div>ID: {params.workspaceId}</div>
    // <div className="">ID: {workspaceId}</div>
    <div className="">Data: {JSON.stringify(data)}</div>
  );
};

export default WorkspaceIdPage;
