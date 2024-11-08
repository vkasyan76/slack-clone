import { api } from "../../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "../../../../convex/_generated/dataModel";

type useGetChannelProps = {
  id: Id<"messages">;
};

export const useGetMessage = ({ id }: useGetChannelProps) => {
  const data = useQuery(api.messages.getById, { id });
  const isLoading = data === undefined;
  return { data, isLoading };
};
