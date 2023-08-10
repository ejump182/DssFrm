"use server";
import "server-only";

import { prisma } from "@formbricks/database";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { DatabaseError, ResourceNotFoundError, ValidationError } from "@formbricks/errors";
import { ZProduct } from "@formbricks/types/v1/product";
import type { TProduct, TProductLookAndFeelInput } from "@formbricks/types/v1/product";
import { cache } from "react";

const selectProduct = {
  id: true,
  createdAt: true,
  updatedAt: true,
  name: true,
  teamId: true,
  brandColor: true,
  highlightBorderColor: true,
  recontactDays: true,
  formbricksSignature: true,
  placement: true,
  clickOutsideClose: true,
  darkOverlay: true,
};

export const getProductByEnvironmentId = cache(async (environmentId: string): Promise<TProduct> => {
  let productPrisma;
  try {
    productPrisma = await prisma.product.findFirst({
      where: {
        environments: {
          some: {
            id: environmentId,
          },
        },
      },
      select: selectProduct,
    });

    if (!productPrisma) {
      throw new ResourceNotFoundError("Product for Environment", environmentId);
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError("Database operation failed");
    }
    throw error;
  }

  try {
    const product = ZProduct.parse(productPrisma);
    return product;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(JSON.stringify(error.errors, null, 2));
    }
    throw new ValidationError("Data validation of product failed");
  }
});

export const updateLookAndFeelOfProduct = async (
  inputProduct: TProductLookAndFeelInput,
  productId: string
): Promise<TProduct> => {
  let updatedProduct;
  try {
    updatedProduct = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        brandColor: inputProduct.brandColor,
        highlightBorderColor: inputProduct.highlightBorderColor,
        formbricksSignature: inputProduct.formbricksSignature,
        placement: inputProduct.placement,
        clickOutsideClose: inputProduct.clickOutsideClose,
        darkOverlay: inputProduct.darkOverlay,
      },
      select: selectProduct,
    });
    if (!updatedProduct) {
      throw new ResourceNotFoundError("Update for Product", productId);
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError("Database operation failed");
    }
    throw error;
  }
  try {
    const product = ZProduct.parse(updatedProduct);
    return product;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(JSON.stringify(error.errors, null, 2));
    }
    throw new ValidationError("Data validation of product failed");
  }
};
