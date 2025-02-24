import { createSignal, onMount, Show, type Component } from "solid-js";

import RootChildrenSelect from "./controls/RootChildrenSelect";

import BookmarkTree from "./controls/BookmarkTree";
import { useWindowState } from "../stores/window";
import { cn } from "../utils";
import { useBookmarkState } from "../stores/bookmarks";
import type { FolderData } from "../types";

const BookmarksPage: Component = () => {
  const externalState = useWindowState((state) => state.externalState);
  const bookmarks = useBookmarkState((state) => state.bookmarks);
  const folders = useBookmarkState((state) => state.folders);

  const [selectValue, setSelectValue] = createSignal<FolderData | null>(null);

  onMount(async () => {
    if (folders().length > 0) {
      setSelectValue(folders()[0]);
      await useBookmarkState.getState().getBookmarks(folders()[0].index);
    }
  });

  const handleSelectChange = (val: FolderData | null) => {
    if (val !== null && val.index >= 1) {
      setSelectValue(val);
      useBookmarkState.getState().getBookmarks(val.index);
    }
  };

  return (
    <div class={cn(externalState() === "right" ? "w-full" : "w-full", "space-y-2")}>
      <Show when={folders().length > 0 && selectValue() !== null}>
        <RootChildrenSelect
          folders={folders()}
          value={selectValue()}
          onChange={(val) => handleSelectChange(val)}
        />
      </Show>
      <Show when={bookmarks() !== null}>
        {/* biome-ignore lint/style/noNonNullAssertion: <explanation> */}
        <BookmarkTree bookmark={bookmarks()!} />
      </Show>
    </div>
  );
};

export default BookmarksPage;
