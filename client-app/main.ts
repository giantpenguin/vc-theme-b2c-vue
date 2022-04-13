import { createApp } from "vue";
import { initCfg, initContext, initMenu } from "@core/utilities";
import { config, context, menu } from "@core/plugins";
import App from "./App.vue";

/**
 * Global Styles
 */
import "@fortawesome/fontawesome-free/css/all.css";
import "@/assets/styles/main.scss";
import createI18nRouter, { currentCultureName, createI18nWithCurrentLocale } from "./i18n";
import routes from "./router";

/**
 * Async application init
 */
(async () => {
  // Load and prepare app config and context
  const [cfg, themeContext] = await Promise.all([initCfg(), initContext()]);

  const defaultLocale = themeContext.defaultLanguage?.twoLetterLanguageName || "en";
  const supportedLocales = themeContext.availLanguages?.map((x) => x.twoLetterLanguageName) || [defaultLocale];

  const i18n = await createI18nWithCurrentLocale({ defaultLocale, supportedLocales });
  const router = createI18nRouter(routes);

  const menus = await initMenu(currentCultureName.value);

  // Create and mount application
  const app = createApp(App);

  app.use(config, cfg);
  app.use(context, themeContext);
  app.use(menu, menus);
  app.use(i18n);
  app.use(router);

  app.mount("#app");
})();
