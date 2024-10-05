import { api } from "../../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "../../../../convex/_generated/dataModel";

type useGetChannelProps = {
  id: Id<"channels">;
};

export const useGetChannel = ({ id }: useGetChannelProps) => {
  const data = useQuery(api.channels.getById, { id });
  const isLoading = data === undefined;
  return { data, isLoading };
};
