import { ContentWrapper } from "@formbricks/ui/ContentWrapper";

export default function ActionsAndAttributesLayout({ children }) {
  return (
    <ContentWrapper pageTitle="Actions" isPageTitleCollapsed>
      {children}
    </ContentWrapper>
  );
}
