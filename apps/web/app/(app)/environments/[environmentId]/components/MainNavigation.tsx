"use client";

import { NavigationLink } from "@/app/(app)/environments/[environmentId]/components/NavigationLink";
import { formbricksLogout } from "@/app/lib/formbricks";
import FBLogo from "@/images/formbricks-wordmark.svg";
import {
  ArrowUpRightIcon,
  BlocksIcon,
  ChevronRightIcon,
  Cog,
  CreditCardIcon,
  KeyIcon,
  LogOutIcon,
  MessageCircle,
  MousePointerClick,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  UserCircleIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@formbricks/lib/cn";
import { getAccessFlags } from "@formbricks/lib/membership/utils";
import { capitalizeFirstLetter, truncate } from "@formbricks/lib/utils/strings";
import { TEnvironment } from "@formbricks/types/environment";
import { TMembershipRole } from "@formbricks/types/memberships";
import { TOrganization } from "@formbricks/types/organizations";
import { TProduct } from "@formbricks/types/product";
import { ProfileAvatar } from "@formbricks/ui/Avatars";
import { Button } from "@formbricks/ui/Button";
import { CreateOrganizationModal } from "@formbricks/ui/CreateOrganizationModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@formbricks/ui/DropdownMenu";

import { AddProductModal } from "./AddProductModal";

interface NavigationProps {
  environment: TEnvironment;
  organizations: TOrganization[];
  session: Session;
  organization: TOrganization;
  products: TProduct[];
  isFormbricksCloud: boolean;
  membershipRole?: TMembershipRole;
  isMultiOrgEnabled: boolean;
}

export const MainNavigation = ({
  environment,
  organizations,
  organization,
  session,
  products,
  isFormbricksCloud,
  membershipRole,
  isMultiOrgEnabled,
}: NavigationProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const [currentOrganizationName, setCurrentOrganizationName] = useState("");
  const [currentOrganizationId, setCurrentOrganizationId] = useState("");
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showCreateOrganizationModal, setShowCreateOrganizationModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isTextVisible, setIsTextVisible] = useState(true);

  const product = products.find((product) => product.id === environment.productId);
  const { isAdmin, isOwner, isViewer } = getAccessFlags(membershipRole);
  const isPricingDisabled = !isOwner && !isAdmin;

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    localStorage.setItem("isMainNavCollapsed", isCollapsed ? "false" : "true");
  };

  useEffect(() => {
    const isCollapsedValueFromLocalStorage = localStorage.getItem("isMainNavCollapsed") === "true";
    setIsCollapsed(isCollapsedValueFromLocalStorage);
  }, []);

  useEffect(() => {
    const toggleTextOpacity = () => {
      setIsTextVisible(isCollapsed ? true : false);
    };
    const timeoutId = setTimeout(toggleTextOpacity, 150);
    return () => clearTimeout(timeoutId);
  }, [isCollapsed]);

  useEffect(() => {
    if (organization && organization.name !== "") {
      setCurrentOrganizationName(organization.name);
      setCurrentOrganizationId(organization.id);
    }
  }, [organization]);

  const sortedOrganizations = useMemo(() => {
    return [...organizations].sort((a, b) => a.name.localeCompare(b.name));
  }, [organizations]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const handleEnvironmentChangeByProduct = (productId: string) => {
    router.push(`/products/${productId}/`);
  };

  const handleEnvironmentChangeByOrganization = (organizationId: string) => {
    router.push(`/organizations/${organizationId}/`);
  };

  const mainNavigation = useMemo(
    () => [
      {
        name: "Surveys",
        href: `/environments/${environment.id}/surveys`,
        icon: MessageCircle,
        isActive: pathname?.includes("/surveys"),
        isHidden: false,
      },
      {
        name: "People",
        href: `/environments/${environment.id}/people`,
        icon: UserIcon,
        isActive:
          pathname?.includes("/people") ||
          pathname?.includes("/segments") ||
          pathname?.includes("/attributes"),
      },
      {
        name: "Actions",
        href: `/environments/${environment.id}/actions`,
        icon: MousePointerClick,
        isActive: pathname?.includes("/actions") || pathname?.includes("/actions"),
        isHidden: false,
      },
      {
        name: "Integrations",
        href: `/environments/${environment.id}/integrations`,
        icon: BlocksIcon,
        isActive: pathname?.includes("/integrations"),
        isHidden: isViewer,
      },
      {
        name: "Configuration",
        href: `/environments/${environment.id}/product/general`,
        icon: Cog,
        isActive: pathname?.includes("/product"),
        isHidden: isViewer,
      },
    ],
    [environment.id, pathname, isViewer]
  );

  const dropdownNavigation = [
    {
      label: "Account",
      href: `/environments/${environment.id}/settings/profile`,
      icon: UserCircleIcon,
    },
    {
      label: "Organization",
      href: `/environments/${environment.id}/settings/members`,
      icon: UsersIcon,
    },
    {
      label: "Billing",
      href: `/environments/${environment.id}/settings/billing`,
      hidden: !isFormbricksCloud || isPricingDisabled,
      icon: CreditCardIcon,
    },
    {
      label: "License",
      href: `/environments/${environment.id}/settings/enterprise`,
      hidden: isFormbricksCloud || isPricingDisabled,
      icon: KeyIcon,
    },
    {
      label: "Documentation",
      href: "https://formbricks.com/docs",
      target: "_blank",
      icon: ArrowUpRightIcon,
    },
    {
      label: "Join Discord",
      href: "https://formbricks.com/discord",
      target: "_blank",
      icon: ArrowUpRightIcon,
    },
  ];

  return (
    <>
      {product && (
        <aside
          className={cn(
            "z-40 flex flex-col justify-between rounded-r-xl border-r border-slate-200 bg-white pt-3 shadow-md transition-all duration-100",
            !isCollapsed ? "w-sidebar-collapsed" : "w-sidebar-expanded",
            environment.type === "development" ? `h-[calc(100vh-1.25rem)]` : "h-screen"
          )}>
          <div>
            {/* Logo and Toggle */}

            <div className="flex items-center justify-between px-3 pb-4">
              {!isCollapsed && (
                <Link
                  href={`/environments/${environment.id}/surveys/`}
                  className={cn(
                    "flex items-center justify-center transition-opacity duration-100",
                    isTextVisible ? "opacity-0" : "opacity-100"
                  )}>
                  <Image src={FBLogo} width={160} height={30} alt="Formbricks Logo" />
                </Link>
              )}
              <Button
                size="icon"
                tooltipSide="right"
                onClick={toggleSidebar}
                className={cn(
                  "rounded-xl bg-slate-50 p-1 text-slate-600 transition-all hover:bg-slate-100 focus:outline-none focus:ring-0 focus:ring-transparent"
                )}>
                {isCollapsed ? (
                  <PanelLeftOpenIcon strokeWidth={1.5} />
                ) : (
                  <PanelLeftCloseIcon strokeWidth={1.5} />
                )}
              </Button>
            </div>

            {/* Main Nav Switch */}
            <ul>
              {mainNavigation.map(
                (item) =>
                  !item.isHidden && (
                    <NavigationLink
                      key={item.name}
                      href={item.href}
                      isActive={item.isActive}
                      isCollapsed={isCollapsed}
                      isTextVisible={isTextVisible}
                      linkText={item.name}>
                      <item.icon strokeWidth={1.5} />
                    </NavigationLink>
                  )
              )}
            </ul>
          </div>
          {/* Product Switch */}
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
                id="productDropdownTrigger"
                className="w-full rounded-br-xl border-t py-4 transition-colors duration-200 hover:bg-slate-50 focus:outline-none">
                <div
                  tabIndex={0}
                  className={cn(
                    "flex cursor-pointer flex-row items-center space-x-5",
                    isCollapsed ? "pl-2" : "pl-4"
                  )}>
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 font-bold text-slate-50">
                    XM
                  </div>
                  {!isCollapsed && !isTextVisible && (
                    <>
                      <div>
                        <p
                          className={cn(
                            "ph-no-capture ph-no-capture -mb-0.5 text-sm font-bold text-slate-700 transition-opacity duration-200 ",
                            isTextVisible ? "opacity-0" : "opacity-100"
                          )}>
                          {product.name}
                        </p>
                        <p
                          className={cn(
                            "text-sm text-slate-500 transition-opacity duration-200",
                            isTextVisible ? "opacity-0" : "opacity-100"
                          )}>
                          Product
                        </p>
                      </div>
                      <ChevronRightIcon
                        className={cn(
                          "h-5 w-5 text-slate-700 transition-opacity duration-200 hover:text-slate-500",
                          isTextVisible ? "opacity-0" : "opacity-100"
                        )}
                      />
                    </>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 space-y-1 rounded-xl border border-slate-200 shadow-sm"
                id="userDropdownInnerContentWrapper"
                side="right"
                sideOffset={10}
                alignOffset={-1}
                align="end">
                <DropdownMenuRadioGroup
                  value={product!.id}
                  onValueChange={(v) => handleEnvironmentChangeByProduct(v)}>
                  {sortedProducts.map((product) => (
                    <DropdownMenuRadioItem
                      value={product.id}
                      className="cursor-pointer break-all rounded-lg"
                      key={product.id}>
                      {product?.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                {!isViewer && (
                  <DropdownMenuItem onClick={() => setShowAddProductModal(true)} className="rounded-lg">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    <span>Add product</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Switch */}
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  id="userDropdownTrigger"
                  className="w-full rounded-br-xl border-t py-4 transition-colors duration-200 hover:bg-slate-50 focus:outline-none">
                  <div
                    tabIndex={0}
                    className={cn(
                      "flex cursor-pointer flex-row items-center space-x-5",
                      isCollapsed ? "pl-2" : "pl-4"
                    )}>
                    <ProfileAvatar userId={session.user.id} imageUrl={session.user.imageUrl} />
                    {!isCollapsed && !isTextVisible && (
                      <>
                        <div className={cn(isTextVisible ? "opacity-0" : "opacity-100")}>
                          <p
                            className={cn(
                              "ph-no-capture ph-no-capture -mb-0.5 text-sm font-bold text-slate-700"
                            )}>
                            {session?.user?.name ? (
                              <span>{truncate(session?.user?.name, 30)}</span>
                            ) : (
                              <span>{truncate(session?.user?.email, 30)}</span>
                            )}
                          </p>
                          <p className={cn("text-sm text-slate-500")}>
                            {capitalizeFirstLetter(organization?.name)}
                          </p>
                        </div>
                        <ChevronRightIcon className={cn("h-5 w-5 text-slate-700 hover:text-slate-500")} />
                      </>
                    )}
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-56 rounded-xl border border-slate-200 shadow-sm"
                  id="userDropdownInnerContentWrapper"
                  side="right"
                  sideOffset={10}
                  alignOffset={5}
                  align="end">
                  {/* Dropdown Items */}

                  {dropdownNavigation.map(
                    (link) =>
                      !link.hidden && (
                        <Link
                          href={link.href}
                          target={link.target}
                          key={link.label}
                          className="flex items-center">
                          <DropdownMenuItem
                            className="w-full gap-x-2 rounded-lg font-normal"
                            key={link.label}>
                            <link.icon className="h-4 w-4" strokeWidth={1.5} />
                            {link.label}
                          </DropdownMenuItem>
                        </Link>
                      )
                  )}

                  {/* Logout */}

                  <DropdownMenuItem
                    className="w-full gap-x-2 rounded-lg font-normal"
                    onClick={async () => {
                      await signOut({ callbackUrl: "/auth/login" });
                      await formbricksLogout();
                    }}>
                    <LogOutIcon className="h-4 w-4" strokeWidth={1.5} />
                    Logout
                  </DropdownMenuItem>

                  {/* Organization Switch */}

                  {(isMultiOrgEnabled || organizations.length > 1) && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="rounded-lg">
                        <div>
                          <p>{currentOrganizationName}</p>
                          <p className="block text-xs text-slate-500">Switch organization</p>
                        </div>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent
                          className="rounded-xl border border-slate-200 shadow-sm"
                          sideOffset={10}
                          alignOffset={5}>
                          <DropdownMenuRadioGroup
                            value={currentOrganizationId}
                            onValueChange={(organizationId) =>
                              handleEnvironmentChangeByOrganization(organizationId)
                            }>
                            {sortedOrganizations.map((organization) => (
                              <DropdownMenuRadioItem
                                value={organization.id}
                                className="cursor-pointer rounded-lg"
                                key={organization.id}>
                                {organization.name}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                          <DropdownMenuSeparator />
                          {isMultiOrgEnabled && (
                            <DropdownMenuItem
                              onClick={() => setShowCreateOrganizationModal(true)}
                              className="rounded-lg">
                              <PlusIcon className="mr-2 h-4 w-4" />
                              <span>Create new organization</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </aside>
      )}
      <CreateOrganizationModal
        open={showCreateOrganizationModal}
        setOpen={(val) => setShowCreateOrganizationModal(val)}
      />
      <AddProductModal
        open={showAddProductModal}
        setOpen={(val) => setShowAddProductModal(val)}
        environmentId={environment.id}
      />
    </>
  );
};
