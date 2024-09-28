import { api } from "../../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "../../../../convex/_generated/dataModel";

type useGetChannelsProps = {
  workspaceId: Id<"workspaces">;
};

export const useGetChannels = ({ workspaceId }: useGetChannelsProps) => {
  const data = useQuery(api.channels.current, { workspaceId });
  const isLoading = data === undefined;
  return { data, isLoading };
};
