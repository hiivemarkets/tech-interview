import { useCallback } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_USER } from "@/lib/operations";
import type { User } from "@/lib/generated/graphql";
import { SimpleForm } from "./SimpleForm";

export function CreateUserForm({
  onUserCreated,
  onError,
}: {
  onUserCreated: (user: User) => void;
  onError: (msg: string) => void;
}) {
  const [createUser] = useMutation(CREATE_USER);

  const handleSubmit = useCallback(
    async (name: string) => {
      const { data } = await createUser({ variables: { name } });
      if (data.createUser.errors?.length > 0) {
        onError(data.createUser.errors.join(", "));
        throw new Error("validation");
      }
      onUserCreated(data.createUser.user);
    },
    [createUser, onUserCreated, onError]
  );

  return (
    <SimpleForm
      title="Create User"
      label="Name"
      fieldId="name"
      submitLabel="Save"
      loadingLabel="Saving..."
      onSubmit={handleSubmit}
    />
  );
}
