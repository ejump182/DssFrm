"use client";

import { cn } from "@formbricks/lib/cn";
import { Button, ColorPicker, Label, Switch } from "@formbricks/ui";
import { useState } from "react";
import toast from "react-hot-toast";
import { DEFAULT_BRAND_COLOR } from "@formbricks/lib/constants";
import { TProduct, TProductUpdateInput } from "@formbricks/types/v1/product";
import { updateProductAction } from "./actions";

interface EditHighlightBorderProps {
  product: TProduct;
}

export const EditHighlightBorder = ({ product }: EditHighlightBorderProps) => {
  const [showHighlightBorder, setShowHighlightBorder] = useState(product.highlightBorderColor ? true : false);
  const [color, setColor] = useState<string | null>(product.highlightBorderColor || DEFAULT_BRAND_COLOR);
  const [updatingBorder, setUpdatingBorder] = useState(false);

  const handleUpdateHighlightBorder = async () => {
    try {
      setUpdatingBorder(true);
      let inputProduct: Partial<TProductUpdateInput> = {
        highlightBorderColor: color,
      };
      await updateProductAction(product.id, inputProduct);
      toast.success("Border color updated successfully.");
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setUpdatingBorder(false);
    }
  };

  const handleSwitch = (checked: boolean) => {
    if (checked) {
      if (!color) {
        setColor(DEFAULT_BRAND_COLOR);
        setShowHighlightBorder(true);
      } else {
        setShowHighlightBorder(true);
      }
    } else {
      setShowHighlightBorder(false);
      setColor(null);
    }
  };

  return (
    <div className="flex min-h-full w-full">
      <div className="flex w-1/2 flex-col px-6 py-5">
        <div className="mb-6 flex items-center space-x-2">
          <Switch id="highlightBorder" checked={showHighlightBorder} onCheckedChange={handleSwitch} />
          <h2 className="text-sm font-medium text-slate-800">Show highlight border</h2>
        </div>

        {showHighlightBorder && color ? (
          <>
            <Label htmlFor="brandcolor">Color (HEX)</Label>
            <ColorPicker color={color} onChange={setColor} />
          </>
        ) : null}

        <Button
          variant="darkCTA"
          className="mt-4 flex max-w-[80px] items-center justify-center"
          loading={updatingBorder}
          onClick={handleUpdateHighlightBorder}>
          Save
        </Button>
      </div>

      <div className="flex w-1/2 flex-col items-center justify-center gap-4 bg-slate-200 px-6 py-5">
        <h3 className="text-slate-500">Preview</h3>
        <div
          className={cn("flex flex-col gap-4 rounded-lg border-2 bg-white p-5")}
          {...(showHighlightBorder &&
            color && {
              style: {
                borderColor: color,
              },
            })}>
          <h3 className="text-sm font-semibold text-slate-800">How easy was it for you to do this?</h3>
          <div className="flex rounded-2xl border border-slate-400">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="border-r border-slate-400 px-6 py-5 last:border-r-0">
                <span className="text-sm font-medium">{num}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
