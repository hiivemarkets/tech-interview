import { useCallback } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_AUCTION } from "@/lib/operations";
import { SimpleForm } from "./SimpleForm";

export function CreateAuctionForm({
  onCreated,
  onError,
}: {
  onCreated: () => void;
  onError: (msg: string) => void;
}) {
  const [createAuction] = useMutation(CREATE_AUCTION);

  const handleSubmit = useCallback(
    async (itemName: string) => {
      const { data } = await createAuction({ variables: { itemName } });
      if (data.createAuction.errors?.length > 0) {
        onError(data.createAuction.errors.join(", "));
        throw new Error("validation");
      }
      onCreated();
    },
    [createAuction, onCreated, onError]
  );

  return (
    <SimpleForm
      title="Create Auction"
      label="Item Name"
      fieldId="item-name"
      submitLabel="Start Auction"
      loadingLabel="Starting..."
      onSubmit={handleSubmit}
    />
  );
}
