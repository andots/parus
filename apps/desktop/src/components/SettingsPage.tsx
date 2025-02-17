import { createSignal, For, type Component } from "solid-js";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Switch, SwitchControl, SwitchThumb } from "@repo/ui/switch";
import { TextField, TextFieldInput } from "@repo/ui/text-field";
import { Button } from "@repo/ui/button";
import { useSettingsState } from "../stores/settings";

// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/select";

const SettingsPage: Component = () => {
  const settings = useSettingsState((state) => state.settings);

  // const [language, setLanguage] = createSignal(settings().language);
  // const [theme, setTheme] = createSignal(settings().theme);
  const [gpuAcceleration, setGpuAcceleration] = createSignal(settings().gpu_acceleration_enabled);
  const [incognito, setIncognito] = createSignal(settings().incognito);
  const [startPageUrl, setStartPageUrl] = createSignal(settings().start_page_url);

  const handleGpuAccelerationChange = (value: boolean) => {
    setGpuAcceleration(value);
  };

  const handleIncognitoChange = (value: boolean) => {
    setIncognito(value);
  };

  const handleStartPageUrlUpdate = () => {
    console.log(startPageUrl());
  };

  // const handleLanguageChange = () => {};
  // const handleThemeChange = () => {};

  return (
    <div class="max-w-2xl m-auto my-4">
      <Card class="w-full">
        <CardHeader>
          <CardTitle class="text-2xl">Settings</CardTitle>
          <CardDescription>Following settings are available.</CardDescription>
        </CardHeader>

        <CardContent class="space-y-6">
          {/* Browser Settings Section */}
          <Card class="w-full p-5">
            <CardTitle class="pb-2 text-base">Webview Settings</CardTitle>
            <CardDescription class="mb-2">These settings require a reboot.</CardDescription>
            <CardContent class="p-2 space-y-4">
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <p class="text-md text-muted-foreground">Enable hardware acceleration</p>
                </div>
                <Switch
                  checked={gpuAcceleration()}
                  onChange={(value) => handleGpuAccelerationChange(value)}
                >
                  <SwitchControl>
                    <SwitchThumb />
                  </SwitchControl>
                </Switch>
              </div>
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <p class="text-md text-muted-foreground">Incognito mode (Private Browsing)</p>
                </div>
                <Switch checked={incognito()} onChange={(value) => handleIncognitoChange(value)}>
                  <SwitchControl>
                    <SwitchThumb />
                  </SwitchControl>
                </Switch>
              </div>
            </CardContent>
          </Card>

          {/* Start Page Section */}
          <Card class="w-full p-5">
            <CardTitle class="pb-2 text-base">Start Page</CardTitle>
            <CardDescription class="mb-2">Open page when starting app.</CardDescription>
            <CardContent class="flex flex-row justify-between items-center p-2 space-x-3">
              <TextField class="w-full">
                <TextFieldInput
                  type="url"
                  id="start-page-url"
                  placeholder="Enter start page url..."
                  value={startPageUrl()}
                  // onChange={(e) => setStartPageUrl(e.currentTarget.value)}
                  onInput={(e) => setStartPageUrl(e.currentTarget.value)}
                />
              </TextField>
              <Button variant={"default"} size="sm" onClick={handleStartPageUrlUpdate}>
                Update
              </Button>
            </CardContent>
          </Card>

          {/* Pinned URLs Section */}
          <Card class="w-full p-5">
            <CardTitle class="pb-2 text-base">Pinned to Tool Bar</CardTitle>
            <CardDescription class="mb-2">
              These pages will be shown on the top toolbar.
            </CardDescription>
            <CardContent class="p-2 space-y-2">
              <For each={settings().pinned_urls}>
                {(url) => (
                  <div class="flex items-center justify-between py-2">
                    <span class="text-base truncate">{url}</span>
                    <Button variant="destructive" size="sm">
                      Remove
                    </Button>
                  </div>
                )}
              </For>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
