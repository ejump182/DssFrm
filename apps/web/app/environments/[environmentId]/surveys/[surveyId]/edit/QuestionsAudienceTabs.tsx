import { cn } from "@/lib/utils";
import { QuestionMarkCircleIcon, UserGroupIcon } from "@heroicons/react/20/solid";

const tabs = [
  {
    id: "questions",
    label: "Questions",
    icon: <QuestionMarkCircleIcon />,
  },
  {
    id: "audience",
    label: "Audience",
    icon: <UserGroupIcon />,
  },
];

export default function QuestionsAudienceTabs({ activeId, setActiveId }) {
  return (
    <div className="flex h-14 w-full items-center justify-center border bg-white">
      <nav className="flex h-full items-center space-x-4" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveId(tab.id)}
            className={cn(
              tab.id === activeId
                ? " border-brand-dark border-b-2 font-semibold text-gray-900"
                : "text-gray-500 hover:text-gray-700",
              "flex h-full items-center px-3 text-sm font-medium"
            )}
            aria-current={tab.id === activeId ? "page" : undefined}>
            {tab.icon && <div className="mr-2 h-5 w-5">{tab.icon}</div>}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
