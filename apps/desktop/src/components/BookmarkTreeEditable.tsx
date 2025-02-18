import { type Component, For, Match, Show, Switch, createSignal } from "solid-js";

import {
  IcBaselineKeyboardArrowDown,
  IcBaselineKeyboardArrowRight,
  IcOutlineFolder,
  IcOutlineFolderOpen,
} from "@repo/ui/icons";
import { useBookmarkState } from "../stores/bookmarks";
import type { Bookmark } from "../types";
import Favicon from "./icons/Favicon";

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuGroupLabel,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@repo/ui/context-menu";

import { useAddFolderDialog, useDeleteConfirmDialog, useEditDialog } from "../stores/dialogs";
import { useUrlState } from "../stores/url";
import { useWindowState } from "../stores/window";

const NavigationArrow = (props: { isOpen: boolean }) => {
  return (
    <Switch>
      <Match when={props.isOpen}>
        <IcBaselineKeyboardArrowDown width={20} height={20} />
      </Match>
      <Match when={!props.isOpen}>
        <IcBaselineKeyboardArrowRight width={20} height={20} />
      </Match>
    </Switch>
  );
};

const FolderIcon = (props: { isOpen: boolean }) => {
  return (
    <Switch>
      <Match when={props.isOpen}>
        <IcOutlineFolderOpen width={20} height={20} />
      </Match>
      <Match when={!props.isOpen}>
        <IcOutlineFolder width={20} height={20} />
      </Match>
    </Switch>
  );
};

const BookmarkTreeEditable: Component = () => {
  const bookmarks = useBookmarkState((state) => state.bookmarks);

  return <BookmarkNode bookmark={bookmarks()} level={0} />;
};

type BookmarkNodeProps = {
  bookmark: Bookmark;
  level: number;
};

const BookmarkNode: Component<BookmarkNodeProps> = (props) => {
  const externalState = useWindowState((state) => state.externalState);
  const navigateToUrl = useUrlState((state) => state.navigateToUrl);

  const [isOpen, setIsOpen] = createSignal(true);
  const hasChildren = () => props.bookmark.children?.length > 0;

  const handleNodeClick = (e: MouseEvent) => {
    // If the node has children and is not a bookmark, toggle the folder
    if (hasChildren() && props.bookmark.node_type !== "Bookmark") {
      e.preventDefault();
      setIsOpen(!isOpen());
    }
    // If the node is a bookmark, navigate to the URL
    if (props.bookmark.url && props.bookmark.node_type === "Bookmark") {
      if (externalState() === "right") {
        // Navigate to the URL
        navigateToUrl(props.bookmark.url);
      } else if (externalState() === "hidden") {
        // Open the right panel and navigate to the URL
        useWindowState.getState().changeExternalState("right");
        navigateToUrl(props.bookmark.url);
      }
    }
  };

  const toggleFolder = (e: MouseEvent) => {
    if (hasChildren()) {
      e.preventDefault();
      setIsOpen(!isOpen());
    }
  };

  const handleKeydown = (e: KeyboardEvent) => {};

  const handleAddBookmark = (index: number) => {};

  const handleAddFolder = (index: number) => {
    useAddFolderDialog.getState().setParentIndex(index);
    useAddFolderDialog.getState().setOpen(true);
  };

  const handleEdit = (index: number) => {
    useEditDialog.getState().setTarget({ index, title: props.bookmark.title });
    useEditDialog.getState().setOpen(true);
  };

  const handleRemove = (index: number) => {
    useDeleteConfirmDialog.getState().setTarget({ index, title: props.bookmark.title });
    useDeleteConfirmDialog.getState().setOpen(true);
  };

  const handleContextMenu = (isOpen: boolean) => {
    if (externalState() === "right" && isOpen) {
      useWindowState.getState().changeExternalState("hidden");
    }
  };

  const handlePinToToolbar = (url: string | null) => {
    //
  };

  return (
    <div>
      <ContextMenu onOpenChange={(isOpen) => handleContextMenu(isOpen)}>
        <ContextMenuTrigger>
          <div
            class={
              "flex items-center text-left text-sm py-1 hover:bg-sidebar-accent transition-colors duration-150"
            }
            style={{ "padding-left": `${props.level * 6}px` }}
          >
            <div class="flex items-center justify-center">
              <div class="w-[20px]" onClick={toggleFolder} onKeyDown={handleKeydown}>
                <Show when={hasChildren()}>
                  <div class="rounded hover:bg-stone-300 cursor-pointer">
                    <NavigationArrow isOpen={isOpen()} />
                  </div>
                </Show>
              </div>
            </div>

            <div
              class="flex items-center w-full cursor-pointer"
              onClick={handleNodeClick}
              onKeyDown={handleKeydown}
            >
              <div class="w-[20px] mr-1">
                <Switch>
                  <Match
                    when={
                      props.bookmark.node_type === "Folder" || props.bookmark.node_type === "Root"
                    }
                  >
                    <FolderIcon isOpen={isOpen()} />
                  </Match>
                  <Match when={props.bookmark.node_type === "Bookmark"}>
                    <Favicon url={`https://${props.bookmark.host}`} width="18" height="18" />
                  </Match>
                </Switch>
              </div>

              {/* Title */}
              <div class="text-sidebar-foreground overflow-hidden whitespace-nowrap text-ellipsis">
                {props.bookmark.title}
              </div>
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuPortal>
          <ContextMenuContent class="w-48">
            <ContextMenuItem onClick={() => handleAddFolder(props.bookmark.index)}>
              <span>Add Folder</span>
            </ContextMenuItem>

            <ContextMenuItem onClick={() => handleAddBookmark(props.bookmark.index)} disabled>
              <span>Add Bookmark (WIP)</span>
            </ContextMenuItem>

            <ContextMenuSeparator />

            <ContextMenuItem onClick={() => handleEdit(props.bookmark.index)}>
              <span>Edit</span>
            </ContextMenuItem>

            <Show when={props.bookmark.node_type === "Bookmark"}>
              <ContextMenuItem onClick={() => handlePinToToolbar(props.bookmark.url)} disabled>
                <span>Pin to Toolbar (WIP)</span>
              </ContextMenuItem>
            </Show>

            <Show when={props.bookmark.node_type !== "Root"}>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => handleRemove(props.bookmark.index)}>
                <span class="text-destructive">Delete</span>
              </ContextMenuItem>
            </Show>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>

      <Show when={hasChildren() && isOpen()}>
        <For each={props.bookmark.children}>
          {(child) => <BookmarkNode bookmark={child} level={props.level + 1} />}
        </For>
      </Show>
    </div>
  );
};

export default BookmarkTreeEditable;

// return (
//   <div>
//     <ContextMenu onOpenChange={(isOpen) => handleContextMenu(isOpen)}>
//       <ContextMenuTrigger>
//         <div
//           class={
//             "flex items-center text-left text-sm py-1 hover:bg-sidebar-accent transition-colors duration-150"
//           }
//           onClick={toggle}
//           onKeyDown={handleKeydown}
//           style={{ "padding-left": `${props.level * 6}px` }}
//         >
//           {/* Folder icon or Favicon */}
//           <span class="flex items-center justify-center mr-1">
//             <Switch>
//               <Match
//                 when={
//                   props.bookmark.node_type === "Folder" || props.bookmark.node_type === "Root"
//                 }
//               >
//                 <span class="flex w-[40px]">
//                   <Show when={isOpen()}>
//                     <IcBaselineKeyboardArrowDown width={20} height={20} />
//                     <IcOutlineFolderOpen width={20} height={20} />
//                   </Show>
//                   <Show when={!isOpen()}>
//                     <IcBaselineKeyboardArrowRight width={20} height={20} />
//                     <IcOutlineFolder width={20} height={20} />
//                   </Show>
//                 </span>
//               </Match>
//               <Match when={props.bookmark.node_type === "Bookmark" && hasChildren()}>
//                 <span class="flex w-[40px]">
//                   <Show when={isOpen()}>
//                     <IcBaselineKeyboardArrowDown width={20} height={20} />
//                   </Show>
//                   <Show when={!isOpen()}>
//                     <IcBaselineKeyboardArrowRight width={20} height={20} />
//                   </Show>
//                   <Favicon url={`https://${props.bookmark.host}`} width="18" height="18" />
//                 </span>
//               </Match>
//               <Match when={props.bookmark.node_type === "Bookmark" && !hasChildren()}>
//                 <span class="flex w-[24px] ml-[24px]">
//                   <Favicon url={`https://${props.bookmark.host}`} width="18" height="18" />
//                 </span>
//               </Match>
//             </Switch>
//           </span>

//           {/* Title */}
//           <span class="text-sidebar-foreground overflow-hidden whitespace-nowrap text-ellipsis">
//             {props.bookmark.title}
//           </span>
//         </div>
//       </ContextMenuTrigger>

//       <ContextMenuPortal>
//         <ContextMenuContent class="w-48">
//           <ContextMenuItem onClick={() => handleAddFolder(props.bookmark.index)}>
//             <span>Add Folder</span>
//           </ContextMenuItem>

//           <ContextMenuItem onClick={() => handleAddBookmark(props.bookmark.index)} disabled>
//             <span>Add Bookmark (WIP)</span>
//           </ContextMenuItem>

//           <ContextMenuSeparator />

//           <ContextMenuItem onClick={() => handleEdit(props.bookmark.index)}>
//             <span>Edit</span>
//           </ContextMenuItem>

//           <Show when={props.bookmark.node_type === "Bookmark"}>
//             <ContextMenuItem onClick={() => handlePinToToolbar(props.bookmark.url)} disabled>
//               <span>Pin to Toolbar (WIP)</span>
//             </ContextMenuItem>
//           </Show>

//           <Show when={props.bookmark.node_type !== "Root"}>
//             <ContextMenuSeparator />
//             <ContextMenuItem onClick={() => handleRemove(props.bookmark.index)}>
//               <span class="text-destructive">Delete</span>
//             </ContextMenuItem>
//           </Show>
//         </ContextMenuContent>
//       </ContextMenuPortal>
//     </ContextMenu>

//     <Show when={hasChildren() && isOpen()}>
//       <For each={props.bookmark.children}>
//         {(child) => <BookmarkNode bookmark={child} level={props.level + 1} />}
//       </For>
//     </Show>
//   </div>
// );
