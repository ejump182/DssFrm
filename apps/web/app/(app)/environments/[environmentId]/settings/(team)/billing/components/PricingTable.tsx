"use client";

import {
  isSubscriptionCancelledAction,
  manageSubscriptionAction,
  upgradePlanAction,
} from "@/app/(app)/environments/[environmentId]/settings/(team)/billing/actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { StripePriceLookupKeys } from "@formbricks/ee/billing/lib/constants";
import { TTeam } from "@formbricks/types/teams";
import { Badge } from "@formbricks/ui/Badge";
import { BillingSlider } from "@formbricks/ui/BillingSlider";
import { Button } from "@formbricks/ui/Button";
import { LoadingSpinner } from "@formbricks/ui/LoadingSpinner";
import { PricingCard } from "@formbricks/ui/PricingCard";

interface PricingTableProps {
  team: TTeam;
  environmentId: string;
  peopleCount: number;
  responseCount: number;
}

export const PricingTable = ({ team, environmentId, peopleCount, responseCount }: PricingTableProps) => {
  const router = useRouter();
  const [loadingCustomerPortal, setLoadingCustomerPortal] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState(false);
  const [cancellingOn, setCancellingOn] = useState<Date | null>(null);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      const isCancelled = await isSubscriptionCancelledAction(team.id);
      if (isCancelled) {
        setCancellingOn(isCancelled.date);
      }
    };
    checkSubscriptionStatus();
  }, [team.id]);

  const openCustomerPortal = async () => {
    setLoadingCustomerPortal(true);
    const sessionUrl = await manageSubscriptionAction(team.id, environmentId);
    router.push(sessionUrl);
    setLoadingCustomerPortal(false);
  };

  const upgradePlan = async (priceLookupKey: StripePriceLookupKeys) => {
    try {
      setUpgradingPlan(true);
      const { status, newPlan, url } = await upgradePlanAction(team.id, environmentId, priceLookupKey);
      setUpgradingPlan(false);
      if (status != 200) {
        throw new Error("Something went wrong");
      }
      if (!newPlan) {
        toast.success("Plan upgraded successfully");
        router.refresh();
      } else if (newPlan && url) {
        router.push(url);
      } else {
        throw new Error("Something went wrong");
      }
    } catch (err) {
      toast.error("Unable to upgrade plan");
    } finally {
      setUpgradingPlan(false);
    }
  };

  const freeFeatures = [
    "Unlimited Surveys",
    "Unlimited Team Members",
    "Unlimited Connected Domains / Apps / Websites",
    "500 Responses / Month",
    "1,000 Identified Users / Month",
    "Logic Jumps, Hidden Fields, Recurring Surveys, etc.",
    "Website Popup Surveys",
    "In-product Surveys for Web with Attribute Targeting",
    "Link Surveys (Shareable Page)",
    "Email Embedded Surveys",
    "All Integrations",
    "API & Webhooks",
  ];

  const startupFeatures = [
    "Everything in Free",
    "2,000 Responses / Month",
    "2,500 Identified Users / Month",
    "Bigger File Uploads in Surveys",
    "Remove Formbricks Branding",
  ];

  const scaleFeatures = [
    "Everything in Startup",
    "5,000 Responses / Month",
    "20,000 Identified Users / Month",
    "Email Support",
    "Multi-Language Surveys",
    "Advanced Targeting based on User Actions",
    "Team Access Control",
  ];

  const enterpriseFeatures = [
    "Everything in Scale",
    "Custom Response Limits",
    "Custom User Identification Limits",
    "Priority Support with SLA",
    "99% Uptime SLA",
    "Customer Success Manager",
    "Technical Onboarding",
  ];

  return (
    <div className="relative">
      {loadingCustomerPortal && (
        <div className="absolute h-full w-full rounded-lg bg-slate-900/5">
          <LoadingSpinner />
        </div>
      )}
      <div className="mx-16 justify-between gap-4 rounded-lg capitalize">
        <div className="flex w-full">
          <h2 className="mr-2 inline-flex w-full text-2xl font-bold text-slate-700">
            Current Plan: {team.billing.plan}
            {cancellingOn && (
              <Badge
                className="mx-2"
                text={`Cancelling: ${cancellingOn ? cancellingOn.toDateString() : ""}`}
                size="normal"
                type="warning"
              />
            )}
          </h2>

          {team.billing.stripeCustomerId && (
            <div className="flex w-full justify-end">
              <Button
                size="sm"
                variant="secondary"
                className="justify-center py-2 shadow-sm"
                loading={loadingCustomerPortal}
                onClick={openCustomerPortal}>
                {team.billing.plan !== "free" ? "Manage Subscription" : "Manage Card details"}
              </Button>
            </div>
          )}
        </div>

        <div className="mt-2 rounded-lg border border-slate-300 bg-slate-100 py-4 capitalize shadow-sm dark:bg-slate-800">
          <div className="mb-2 flex items-center gap-x-4"></div>
          {
            <div className="relative mx-8 mb-16 mt-4">
              Responses
              <BillingSlider
                className="slider-class"
                value={responseCount}
                max={team.billing.limits.monthly.responses * 1.5}
                freeTierLimit={team.billing.limits.monthly.responses}
                metric={"Responses"}
              />
            </div>
          }
          <div className="mb-2 flex items-center gap-x-4"></div>
          {
            <div className="relative mx-8 mb-16 mt-4">
              Monthly Identified Users
              <BillingSlider
                className="slider-class"
                value={peopleCount}
                max={team.billing.limits.monthly.miu * 1.5}
                freeTierLimit={team.billing.limits.monthly.miu}
                metric={"MIU"}
              />
            </div>
          }
        </div>
        <div className="flex w-full justify-center gap-x-4">
          <PricingCard
            title={"Formbricks Startup"}
            subtitle={"Ideal for small teams"}
            plan="startup"
            monthlyPrice={49}
            actionText={"Starting at"}
            team={team}
            paidFeatures={startupFeatures}
            loading={upgradingPlan}
            onUpgrade={() => upgradePlan(StripePriceLookupKeys.startupMonthly)}
          />
          <PricingCard
            title={"Formbricks Scale"}
            subtitle={"Ideal for growing teams"}
            plan="scale"
            monthlyPrice={199}
            actionText={"Starting at"}
            team={team}
            paidFeatures={scaleFeatures}
            loading={upgradingPlan}
            onUpgrade={() => upgradePlan(StripePriceLookupKeys.scaleMonthly)}
          />
          <PricingCard
            title={"Formbricks Enterprise"}
            subtitle={"Ideal for large teams"}
            plan="enterprise"
            team={team}
            paidFeatures={enterpriseFeatures}
            loading={upgradingPlan}
            onUpgrade={() => (window.location.href = "mailto:hola@formbricks.com")}
          />
        </div>
        <PricingCard
          title={"Formbricks Free"}
          subtitle={"Available to Everybody"}
          plan="free"
          team={team}
          paidFeatures={freeFeatures}
          loading={upgradingPlan}
          onUpgrade={() => toast.error("Everybody has the free plan by default!")}
        />
      </div>
    </div>
  );
};
