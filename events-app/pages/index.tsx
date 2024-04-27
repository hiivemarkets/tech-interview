import { useQuery } from "@apollo/client";
import EVENTS_QUERY from "./EventsQuery.graphql";

export default function Home() {
  const { data, loading, error } = useQuery(EVENTS_QUERY);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold py-4">Events</h1>
        <p className="py-4">
          <strong>Prompt:</strong> Display events sorted reverse
          chronologically, grouped by date. Within each group events should be
          sorted chronologically. Each event type should render uniquely to
          differentiate the types at a glance (e.g. using a different color, an
          icon, etc).
        </p>
        <div className="relative">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-start">
            <span className="bg-white pr-3 text-lg font-medium text-gray-900">
              Date 1
            </span>
          </div>
        </div>

        <div className="overflow-hidden bg-white shadow sm:rounded-md mt-4">
          <ol role="list" className="divide-y divide-gray-200">
            <li className="px-4 py-4 sm:px-6">First event</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
