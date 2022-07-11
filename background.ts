import iconSrc from "url:./assets/dev_icon.png";
import { Storage } from "@plasmohq/storage";
chrome.management.getSelf((self) => {
    console.log("install type", self.installType);
    if (self.installType === "development") {
        console.log("development version");
        chrome.action.setIcon({ path: iconSrc });
    }
});

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(async function (details) {
    if (details.reason == "install") {
        console.log("This is a first install!");
        //on first install we need to set chrome storage to have the default values

        // chrome.storage.sync.set({
        //     appliedColor: "#4b9e59",
        //     bannedColor: "#eb5f4d",
        //     hideBannedJobs: "false",
        // },);

        const storage = new Storage();

        await storage.set("showSideBarInfo", false);
        await storage.set("hideDuoIfCall", false);
    } else if (details.reason == "update") {
        var thisVersion = chrome.runtime.getManifest().version;
        console.log(
            "Updated from " +
                details.previousVersion +
                " to " +
                thisVersion +
                "!",
        );
    }
});

export {};
