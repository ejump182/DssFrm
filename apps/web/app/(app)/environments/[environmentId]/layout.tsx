import EnvironmentsNavbar from "@/app/(app)/environments/[environmentId]/EnvironmentsNavbar";
import ToasterClient from "@/components/ToasterClient";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import FormbricksClient from "../../FormbricksClient";
import { ResponseFilterProvider } from "@/app/(app)/environments/[environmentId]/ResponseFilterContext";
import { hasUserEnvironmentAccess } from "@/lib/api/apiHelper";

export default async function EnvironmentLayout({ children, params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return redirect(`/auth/login`);
  }
  const hasAccess = await hasUserEnvironmentAccess(session.user, params.environmentId);
  if (!hasAccess) {
    throw new Error("User does not have access to this environment");
  }

  return (
    <>
      <ResponseFilterProvider>
        <FormbricksClient session={session} />
        <ToasterClient />
        <EnvironmentsNavbar environmentId={params.environmentId} session={session} />
        <main className="h-full flex-1 overflow-y-auto bg-slate-50">
          {children}
          <main />
        </main>
      </ResponseFilterProvider>
    </>
  );
}
