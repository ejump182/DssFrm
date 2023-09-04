import GoBackButton from "@/components/shared/GoBackButton";
import { DeletePersonButton } from "./DeletePersonButton";
import { getPerson } from "@formbricks/lib/services/person";
import { getPersonIdentifier } from "@formbricks/lib/helpers/people";


interface HeadingSectionProps {
  environmentId: string;
  personId: string;
}

export default async function HeadingSection({ environmentId, personId }: HeadingSectionProps) {
  const person = await getPerson(personId);

  if (!person) {
    throw new Error("No such person found");
  }
  return (
    <>
      <GoBackButton />
      <div className="flex items-baseline justify-between border-b border-slate-200 pb-6 pt-4">
        <h1 className="ph-no-capture text-4xl font-bold tracking-tight text-slate-900">
          <span>{getPersonIdentifier (person)}</span>
        </h1>
        <div className="flex items-center space-x-3">
          <DeletePersonButton environmentId={environmentId} personId={personId} />
        </div>
      </div>
    </>
  );
}
