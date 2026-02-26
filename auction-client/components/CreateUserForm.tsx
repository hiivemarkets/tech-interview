import { useState, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_USER } from "@/lib/operations";
import type { User } from "@/lib/generated/graphql";

export function CreateUserForm({
  onUserCreated,
  onError,
}: {
  onUserCreated: (user: User) => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [createUser, { loading }] = useMutation(CREATE_USER);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;

      try {
        const { data } = await createUser({ variables: { name: name.trim() } });
        if (data.createUser.errors?.length > 0) {
          onError(data.createUser.errors.join(", "));
        } else {
          onUserCreated(data.createUser.user);
          setName("");
        }
      } catch (err: any) {
        onError(err.message);
      }
    },
    [name, createUser, onUserCreated, onError]
  );

  return (
    <form className="mx-auto max-w-3xl" onSubmit={handleSubmit}>
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Create User
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Name
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="given-name"
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
          disabled={loading || !name.trim()}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
