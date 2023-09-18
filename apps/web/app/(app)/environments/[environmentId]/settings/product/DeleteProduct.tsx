import { getProducts } from "@formbricks/lib/services/product";
import { getTeamByEnvironmentId } from "@formbricks/lib/services/team";
import { TProduct } from "@formbricks/types/v1/product";
import DeleteProductRender from "@/app/(app)/environments/[environmentId]/settings/product/DeleteProductRender";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

type DeleteProductProps = {
  environmentId: string;
  product: TProduct;
};

export default async function DeleteProduct({ environmentId, product }: DeleteProductProps) {
  const session = await getServerSession(authOptions);
  const team = await getTeamByEnvironmentId(environmentId);
  const availableProducts = team ? await getProducts(team.id) : null;

  const role = team ? session?.user.teams.find((foundTeam) => foundTeam.id === team.id)?.role : null;
  const availableProductsLength = availableProducts ? availableProducts.length : 0;
  const isUserAdminOrOwner = role === "admin" || role === "owner";
  const isDeleteDisabled = availableProductsLength <= 1 || !isUserAdminOrOwner;

  return (
    <DeleteProductRender
      isDeleteDisabled={isDeleteDisabled}
      isUserAdminOrOwner={isUserAdminOrOwner}
      product={product}
      environmentId={environmentId}
      userId={session?.user.id ?? ""}
    />
  );
}
