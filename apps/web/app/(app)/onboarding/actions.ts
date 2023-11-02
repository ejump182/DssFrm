"use server";

import { authOptions } from "@formbricks/lib/authOptions";
import { getProduct, updateProduct } from "@formbricks/lib/product/service";
import { updateProfile } from "@formbricks/lib/profile/service";
import { TProductUpdateInput } from "@formbricks/types/product";
import { TProfileUpdateInput } from "@formbricks/types/profile";
import { getServerSession } from "next-auth";
import { AuthorizationError } from "@formbricks/types/errors";
import { canUserAccessProduct, verifyUserRoleAccess } from "@formbricks/lib/product/auth";
import { getTeam } from "@formbricks/lib/team/service";

export async function updateProfileAction(updatedProfile: Partial<TProfileUpdateInput>) {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthorizationError("Not authorized");

  return await updateProfile(session.user.id, updatedProfile);
}

export async function updateProductAction(productId: string, updatedProduct: Partial<TProductUpdateInput>) {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthorizationError("Not authorized");

  const isAuthorized = await canUserAccessProduct(session.user.id, productId);
  if (!isAuthorized) throw new AuthorizationError("Not authorized");

  const product = await getProduct(productId);

  const { hasCreateOrUpdateAccess } = await verifyUserRoleAccess(product!.teamId, session.user.id);
  if (!hasCreateOrUpdateAccess) throw new AuthorizationError("Not authorized");

  return await updateProduct(productId, updatedProduct);
}
