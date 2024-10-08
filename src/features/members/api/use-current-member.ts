import { api } from "../../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "../../../../convex/_generated/dataModel";

type useCurrentMemberProps = {
  workspaceId: Id<"workspaces">;
};
export const useCurrentMember = ({ workspaceId }: useCurrentMemberProps) => {
  const data = useQuery(api.members.current, { workspaceId });
  const isLoading = data === undefined;

  return { data, isLoading };
};
