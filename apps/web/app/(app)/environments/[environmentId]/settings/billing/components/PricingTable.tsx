"use client";

import { TTeam } from "@formbricks/types/teams";
import { Button } from "@formbricks/ui/Button";
import LoadingSpinner from "@formbricks/ui/LoadingSpinner";
import { PricingCard } from "@formbricks/ui/PricingCard";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  manageSubscriptionAction,
  removeSubscriptionAction,
  upgradePlanAction,
} from "@/app/(app)/environments/[environmentId]/settings/billing/actions";

import { PriceLookupKeysInStripe, ProductFeatureKeysInDb } from "@formbricks/ee/billing/lib/constants";
import { DeleteDialog } from "@formbricks/ui/DeleteDialog";
import toast from "react-hot-toast";

interface PricingTableProps {
  team: TTeam;
  environmentId: string;
  peopleCount: number;
  responseCount: number;
  userTargetingFreeMtu: number;
  appSurveyFreeResponses: number;
}

export default function PricingTableComponent({
  team,
  environmentId,
  peopleCount,
  responseCount,
  userTargetingFreeMtu,
  appSurveyFreeResponses,
}: PricingTableProps) {
  const router = useRouter();
  const [loadingCustomerPortal, setLoadingCustomerPortal] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [activeLookupKey, setActiveLookupKey] = useState<PriceLookupKeysInStripe>();

  const openCustomerPortal = async () => {
    setLoadingCustomerPortal(true);
    const sessionUrl = await manageSubscriptionAction(team.id, environmentId);
    router.push(sessionUrl);
    setLoadingCustomerPortal(true);
  };

  const upgradePlan = async (priceLookupKeysToSubscribeTo: PriceLookupKeysInStripe[]) => {
    try {
      setUpgradingPlan(true);
      const paymentUrl = await upgradePlanAction(team.id, environmentId, priceLookupKeysToSubscribeTo);
      setUpgradingPlan(false);
      if (!paymentUrl || paymentUrl === "") {
        toast.success("Plan upgraded successfully");
        router.refresh();
      } else {
        router.push(paymentUrl);
      }
    } catch (err) {
      toast.error("Unable to upgrade plan");
    } finally {
      setUpgradingPlan(false);
    }
  };

  const handleUnsubscribe = async (e, lookupKey) => {
    try {
      e.preventDefault();
      setActiveLookupKey(lookupKey);
      setOpenDeleteModal(true);
    } catch (err) {
      toast.error("Unable to open delete modal");
    }
  };

  const handleDeleteSubscription = async () => {
    try {
      if (!activeLookupKey) throw new Error("No active lookup key");
      await removeSubscriptionAction(team.id, environmentId, [activeLookupKey]);
      router.refresh();
      toast.success("Subscription deleted successfully");
    } catch (err) {
      toast.error("Unable to delete subscription");
    } finally {
      setOpenDeleteModal(false);
    }
  };

  const coreAndWebAppSurveyFeatures = [
    {
      title: "Team Roles",
      comingSoon: false,
      unlimited: true,
    },
    {
      title: "250 responses / month free",
      comingSoon: false,
    },
    {
      title: "$0.15 / responses afterwards",
      comingSoon: false,
    },
    {
      title: "Multi Language Surveys",
      comingSoon: true,
      unlimited: true,
    },
    {
      title: "Unlimited Responses",
      unlimited: true,
    },
  ];

  const userTargetingFeatures = [
    {
      title: "2.500 identified users / month free",
      comingSoon: false,
    },
    {
      title: "$0.01 / identified user afterwards",
      comingSoon: false,
    },
    {
      title: "Advanced Targeting",
      comingSoon: true,
      unlimited: true,
    },
    {
      title: "Unlimited User Identification",
      unlimited: true,
    },
  ];

  const linkSurveysFeatures = [
    {
      title: "Remove Formbricks Branding",
      comingSoon: false,
      unlimited: true,
    },
    {
      title: "File Uploads upto 1 GB",
      comingSoon: false,
      unlimited: true,
    },
    {
      title: "Multi Language Surveys",
      comingSoon: true,
      unlimited: true,
    },
  ];

  const unlimitedPaid = [
    "Unlimited Responses",
    "Unlimited User Targeting",
    "Core & App Surveys Plan",
    "Link Surveys Plan",
    "User Targeting Plan",
  ];

  return (
    <div className="relative">
      {loadingCustomerPortal && (
        <div className="absolute h-full w-full rounded-lg bg-slate-900/5">
          <LoadingSpinner />
        </div>
      )}
      <div className="justify-between gap-4 rounded-lg">
        {team.billing.stripeCustomerId ? (
          <div className="flex w-full justify-end">
            <Button
              variant="secondary"
              className="justify-center py-2 shadow-sm"
              loading={loadingCustomerPortal}
              onClick={openCustomerPortal}>
              Manage Card Details
            </Button>
          </div>
        ) : (
          <div className="relative isolate mt-8 overflow-hidden rounded-lg bg-gray-900 px-3 pt-8 shadow-2xl sm:px-8 md:pt-12 lg:flex lg:gap-x-10 lg:px-12 lg:pt-0">
            <svg
              viewBox="0 0 1024 1024"
              className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0"
              aria-hidden="true">
              <circle
                cx={512}
                cy={512}
                r={512}
                fill="url(#759c1415-0410-454c-8f7c-9a820de03641)"
                fillOpacity="0.7"
              />
              <defs>
                <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
                  <stop stopColor="#00E6CA" />
                  <stop offset={0} stopColor="#00C4B8" />
                </radialGradient>
              </defs>
            </svg>
            <div className="flex-3 mx-auto max-w-md text-center lg:mx-0 lg:py-16 lg:text-left">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Exclusive Unlimited Plan</h2>
              <p className="text-md mt-6 leading-8 text-gray-300">
                With the unlimited plan, get the most out of Formbricks with every feature included, no
                limiting, and no additional costs. <br />
                <br /> We also have our metered billing below where you will not be charged until you exceed
                the free tier limits.
              </p>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center lg:pr-8">
              <ul className="mb-4 mt-8 text-gray-300">
                {unlimitedPaid.map((feature, index) => (
                  <li key={index} className="mb-1">
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant="darkCTA"
                className="w-full justify-center py-2 text-white shadow-sm"
                loading={upgradingPlan}
                onClick={() =>
                  upgradePlan([
                    PriceLookupKeysInStripe.appSurveyUnlimited,
                    PriceLookupKeysInStripe.linkSurveyUnlimited,
                    PriceLookupKeysInStripe.userTargetingUnlimited,
                  ])
                }>
                Upgrade now at $99/month
              </Button>
            </div>
          </div>
        )}

        <PricingCard
          title={"Core & App Surveys"}
          subtitle={"Get up to 250 free responses every month"}
          featureName={ProductFeatureKeysInDb[ProductFeatureKeysInDb.appSurvey]}
          monthlyPrice={0}
          actionText={"Starting at"}
          team={team}
          metric="responses"
          sliderValue={responseCount}
          sliderLimit={350}
          freeTierLimit={appSurveyFreeResponses}
          paidFeatures={coreAndWebAppSurveyFeatures.filter(
            (feature) => team.billing.features.appSurvey.unlimited && feature.unlimited
          )}
          perMetricCharge={0.15}
          loading={upgradingPlan}
          onUpgrade={() => upgradePlan([PriceLookupKeysInStripe.appSurvey])}
          onUbsubscribe={(e) =>
            handleUnsubscribe(e, ProductFeatureKeysInDb[ProductFeatureKeysInDb.appSurvey])
          }
        />

        <PricingCard
          title={"Link Survey"}
          subtitle={"Link Surveys include unlimited surveys and responses for free."}
          featureName={ProductFeatureKeysInDb[ProductFeatureKeysInDb.linkSurvey]}
          monthlyPrice={30}
          actionText={""}
          team={team}
          paidFeatures={linkSurveysFeatures.filter(
            (feature) => team.billing.features.linkSurvey.unlimited && feature.unlimited
          )}
          loading={upgradingPlan}
          onUpgrade={() => upgradePlan([PriceLookupKeysInStripe.linkSurvey])}
          onUbsubscribe={(e) =>
            handleUnsubscribe(e, ProductFeatureKeysInDb[ProductFeatureKeysInDb.linkSurvey])
          }
        />

        <PricingCard
          title={"User Targeting"}
          subtitle={"Target up to 2500 users every month"}
          featureName={ProductFeatureKeysInDb[ProductFeatureKeysInDb.userTargeting]}
          monthlyPrice={0}
          actionText={"Starting at"}
          team={team}
          metric="people"
          sliderValue={peopleCount}
          sliderLimit={3500}
          freeTierLimit={userTargetingFreeMtu}
          paidFeatures={userTargetingFeatures.filter(
            (feature) => team.billing.features.userTargeting.unlimited && feature.unlimited
          )}
          perMetricCharge={0.01}
          loading={upgradingPlan}
          onUpgrade={() => upgradePlan([PriceLookupKeysInStripe.userTargeting])}
          onUbsubscribe={(e) =>
            handleUnsubscribe(e, ProductFeatureKeysInDb[ProductFeatureKeysInDb.userTargeting])
          }
        />
      </div>
      <DeleteDialog
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
        deleteWhat="Subscription"
        onDelete={() => {
          handleDeleteSubscription();
        }}
      />
    </div>
  );
}
