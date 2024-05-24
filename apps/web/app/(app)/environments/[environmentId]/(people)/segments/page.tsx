import { PeopleSecondaryNavigation } from "@/app/(app)/environments/[environmentId]/(people)/people/components/PeopleSecondaryNavigation";
import { BasicCreateSegmentModal } from "@/app/(app)/environments/[environmentId]/(people)/segments/components/BasicCreateSegmentModal";
import { SegmentTable } from "@/app/(app)/environments/[environmentId]/(people)/segments/components/SegmentTable";

import { CreateSegmentModal } from "@formbricks/ee/advancedTargeting/components/CreateSegmentModal";
import { ACTIONS_TO_EXCLUDE } from "@formbricks/ee/advancedTargeting/lib/constants";
import { getAdvancedTargetingPermission } from "@formbricks/ee/lib/service";
import { getActionClasses } from "@formbricks/lib/actionClass/service";
import { getAttributeClasses } from "@formbricks/lib/attributeClass/service";
import { IS_FORMBRICKS_CLOUD } from "@formbricks/lib/constants";
import { getEnvironment } from "@formbricks/lib/environment/service";
import { getSegments } from "@formbricks/lib/segment/service";
import { getTeamByEnvironmentId } from "@formbricks/lib/team/service";
import { PageContentWrapper } from "@formbricks/ui/PageContentWrapper";
import { PageHeader } from "@formbricks/ui/PageHeader";

const Page = async ({ params }) => {
  const [environment, segments, attributeClasses, actionClassesFromServer, team] = await Promise.all([
    getEnvironment(params.environmentId),
    getSegments(params.environmentId),
    getAttributeClasses(params.environmentId),
    getActionClasses(params.environmentId),
    getTeamByEnvironmentId(params.environmentId),
  ]);

  if (!environment) {
    throw new Error("Environment not found");
  }

  if (!team) {
    throw new Error("Team not found");
  }

  const isAdvancedTargetingAllowed = await getAdvancedTargetingPermission(team);

  if (!segments) {
    throw new Error("Failed to fetch segments");
  }

  const filteredSegments = segments.filter((segment) => !segment.isPrivate);

  const actionClasses = actionClassesFromServer.filter((actionClass) => {
    if (actionClass.type === "automatic") {
      if (ACTIONS_TO_EXCLUDE.includes(actionClass.name)) {
        return false;
      }

      return true;
    }

    return true;
  });

  const renderCreateSegmentButton = () =>
    isAdvancedTargetingAllowed ? (
      <CreateSegmentModal
        environmentId={params.environmentId}
        actionClasses={actionClasses}
        attributeClasses={attributeClasses}
        segments={filteredSegments}
      />
    ) : (
      <BasicCreateSegmentModal
        attributeClasses={attributeClasses}
        environmentId={params.environmentId}
        isFormbricksCloud={IS_FORMBRICKS_CLOUD}
      />
    );

  return (
    <PageContentWrapper>
      <PageHeader pageTitle="People" cta={renderCreateSegmentButton()}>
        <PeopleSecondaryNavigation activeId="segments" environmentId={params.environmentId} />
      </PageHeader>
      <SegmentTable
        segments={filteredSegments}
        actionClasses={actionClasses}
        attributeClasses={attributeClasses}
        isAdvancedTargetingAllowed={isAdvancedTargetingAllowed}
      />
    </PageContentWrapper>
  );
};

export default Page;
