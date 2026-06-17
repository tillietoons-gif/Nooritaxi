type NavigationRouter = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: any) => void;
};

export function safeBack(router: NavigationRouter, fallback: any = '/(tabs)/home') {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}
