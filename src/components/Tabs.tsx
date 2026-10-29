// Tabs on Radix in two looks: Fibery's segmented switch ("Workspace / Personal") and underlined page tabs.
import {createContext, forwardRef, useContext, type ComponentPropsWithoutRef, type ElementRef} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import {cx} from "../cx";

export const Tabs = TabsPrimitive.Root;

type TabsVariant = "segmented" | "line";
const VariantContext = createContext<TabsVariant>("segmented");

export type TabsListProps = ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {variant?: TabsVariant};

/** Row of tab triggers; `variant` styles the whole row. */
export const TabsList = forwardRef<ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({variant = "segmented", className, ...props}, ref) => (
    <VariantContext.Provider value={variant}>
      <TabsPrimitive.List ref={ref} data-variant={variant} className={cx("fui-tabs-list", className)} {...props} />
    </VariantContext.Provider>
  ),
);
TabsList.displayName = "TabsList";

export const TabsTrigger = forwardRef<ElementRef<typeof TabsPrimitive.Trigger>, ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(
  ({className, ...props}, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      data-variant={useContext(VariantContext)}
      className={cx("fui-tabs-trigger", className)}
      {...props}
    />
  ),
);
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = forwardRef<ElementRef<typeof TabsPrimitive.Content>, ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(
  ({className, ...props}, ref) => <TabsPrimitive.Content ref={ref} className={cx("fui-tabs-content", className)} {...props} />,
);
TabsContent.displayName = "TabsContent";
