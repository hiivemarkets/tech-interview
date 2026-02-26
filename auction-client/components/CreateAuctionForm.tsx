import { useState, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_AUCTION } from "@/lib/operations";

export function CreateAuctionForm({
  userId,
  onCreated,
  onError,
}: {
  userId: string;
  onCreated: () => void;
  onError: (msg: string) => void;
}) {
  const [itemName, setItemName] = useState("");
  const [createAuction, { loading }] = useMutation(CREATE_AUCTION);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!itemName.trim()) return;

      try {
        const { data } = await createAuction({
          variables: { itemName: itemName.trim() },
          context: { headers: { "X-User-Id": userId } },
        });
        if (data.createAuction.errors?.length > 0) {
          onError(data.createAuction.errors.join(", "));
        } else {
          setItemName("");
          onCreated();
        }
      } catch (err: any) {
        onError(err.message);
      }
    },
    [itemName, userId, createAuction, onCreated, onError]
  );

  return (
    <form className="mx-auto max-w-3xl" onSubmit={handleSubmit}>
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Create Auction
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="item-name"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Item Name
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="item-name"
                  id="item-name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button
          type="submit"
          disabled={loading || !itemName.trim()}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {loading ? "Starting..." : "Start Auction"}
        </button>
      </div>
    </form>
  );
}
