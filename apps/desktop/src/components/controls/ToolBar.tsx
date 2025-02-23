import { Button } from "@repo/ui/button";
import { type Component, createEffect, For, on, Show } from "solid-js";

import { OcticonGear24, OcticonSidebarCollapse24, OcticonSidebarExpand24 } from "@repo/ui/icons";
import { useUrlState } from "../../stores/url";
import { useWindowState } from "../../stores/window";
import AddressBar from "./AddressBar";
import Favicon from "../icons/Favicon";
import { usePageState } from "../../stores/pages";
import { useBookmarkState } from "../../stores/bookmarks";

const ToolBar: Component = () => {
  const bookmarks = useBookmarkState((state) => state.bookmarks);
  const toolbarBookmarks = useBookmarkState((state) => state.toolbarBookmarks);

  createEffect(
    on(bookmarks, () => {
      useBookmarkState.getState().getToolbarBookmarks();
    }),
  );

  const navigateToUrl = useUrlState((state) => state.navigateToUrl);

  const externalState = useWindowState((state) => state.externalState);
  const changeExternalState = useWindowState((state) => state.changeExternalState);

  const page = usePageState((state) => state.page);
  const setPage = usePageState((state) => state.setPage);

  const handleSidebar = () => {
    setPage("home");
    if (externalState() === "right") {
      changeExternalState("full");
    } else if (externalState() === "full") {
      changeExternalState("right");
    } else if (externalState() === "hidden") {
      changeExternalState("right");
    }
  };

  const handlePinnedUrl = (url: string) => {
    setPage("home");
    navigateToUrl(url);
    if (externalState() === "hidden") {
      changeExternalState("right");
    }
  };

  const handleSettings = () => {
    if (page() === "settings") {
      changeExternalState("right");
      setPage("home");
    } else {
      changeExternalState("hidden");
      setPage("settings");
    }
  };

  return (
    <div class="flex justify-center items-center w-full h-full px-2">
      {/* menu button */}
      <Button
        class="w-9 h-9 m-0 p-2 [&_svg]:size-6 [&_svg]:shrink-0"
        variant="ghost"
        size="icon"
        onClick={handleSidebar}
      >
        <Show when={externalState() === "right"}>
          <OcticonSidebarCollapse24 />
        </Show>
        <Show when={externalState() === "hidden"}>
          {/* <OcticonSidebar24 /> */}
          <OcticonSidebarCollapse24 />
        </Show>
        <Show when={externalState() === "full"}>
          <OcticonSidebarExpand24 />
        </Show>
      </Button>

      {/* pinned url favicons */}
      <div class="flex items-center ml-2">
        <For each={toolbarBookmarks()}>
          {(bookmark) => (
            <Button
              variant="ghost"
              class="w-9 h-9 p-2"
              onClick={() => handlePinnedUrl(bookmark.url)}
            >
              <Favicon url={`https://${bookmark.host}`} width="18" height="18" />
            </Button>
          )}
        </For>
      </div>

      {/* address bar */}
      <AddressBar />

      {/* settings button */}
      <Button
        class="w-9 h-9 m-0 p-2 [&_svg]:size-5 [&_svg]:shrink-0"
        variant="ghost"
        size="icon"
        onClick={() => handleSettings()}
      >
        <OcticonGear24 />
      </Button>
    </div>
  );
};

export default ToolBar;
