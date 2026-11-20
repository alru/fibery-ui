// Language of the kit's texts inside the React tree: FiberyUIProvider sets it, components take their default texts
// from it. Without a provider it is Russian, the kit's original language.
import { createContext, useContext } from "react";
import { KIT_TEXTS } from "../i18n";
export const KitLangContext = createContext("ru");
/** Language of the kit's texts: the `lang` of the nearest FiberyUIProvider, `"ru"` without one. */
export const useKitLang = () => useContext(KitLangContext);
// The kit's texts in the current language.
export const useKitTexts = () => KIT_TEXTS[useKitLang()];
