import type { PlasmoContentScript } from "plasmo";
import { addTagToPage, getFossabotCommand } from "~util/functions";
import { Storage } from "@plasmohq/storage";
export const config: PlasmoContentScript = {
    matches: ["https://www.twitch.tv/*"],
};

var currentStreamer = "";

const main = async () => {
    const storage = new Storage();
    const hideDuoIfCall = await storage.get<boolean>("hideDuoIfCall");

    const isCallCommandNull = await getFossabotCommand("call");
    console.log("TESTING CALL", hideDuoIfCall);

    //if the checkbox is checked to hide duo when call is active we go thru a few checsk

    //1. check if call command is even set
    //-----if not just call duo
    //-----if it is call it
    if (hideDuoIfCall) {
        if (isCallCommandNull === null) {
            await addTagToPage("duo");
        } else {
            await addTagToPage("call");
        }
    } else {
        await addTagToPage("duo");
        await addTagToPage("call");
    }
    // if (window.location.href.includes("tarik")) {

    //we hit the fossabot api before anything else so we can insant load the data when were ready

    // var duoCommandResponse = await getFossabotCommand("duo");

    // var spanArray: HTMLSpanElement[] = [];

    // //we now check to see if duo has any response
    // if (duoCommandResponse !== null) {
    //     //break the text up into custom object
    //     const textArray = splitIntoSpans(duoCommandResponse);
    //     //each index of the array gets checked for if it is an emote
    //     const updatedTextArray = await checkForEmotes(textArray);
    //     //we not create spans for the array of objects
    //     //if it is text simply append the text to the span
    //     //if it is an emote we create an image and append it to the span
    //     spanArray = createSpans(updatedTextArray);
    //     const secondSpanArray = createSpans(updatedTextArray);

    //     //we now grab the information from the dom to append our custom tag
    //     var streamerName = document.getElementsByTagName("h1")[0];
    //     while (!streamerName) {
    //         streamerName = document.getElementsByTagName("h1")[0];
    //         console.log("waiting for streamer name");
    //         await new Promise((resolve) => setTimeout(resolve, 2000));
    //     }

    //     //this is used for when the url changes and we need to insure the h1 is updated before we attempt to grab new data
    //     currentStreamer = streamerName.innerText;

    //     //div that contains the streamers name and partner badge
    //     const parentDiv = streamerName.parentElement.parentElement;

    //     //checking if weve already injecting our custom tag
    //     const doesDuoDivExistFromBefore = document.getElementById("duo-div");

    //     //removing our custom tage before we inject it again
    //     if (doesDuoDivExistFromBefore) {
    //         doesDuoDivExistFromBefore.remove();
    //     }

    //     //this is the div that will contain all spans
    //     var duoDiv = createTag("test", theme);

    //     //we take the array of spans we got from createSpans and append them all to the duo div
    //     for (const span of spanArray) {
    //         duoDiv.appendChild(span);
    //     }

    //     //we append the duo div to the parent div which is the div that originally contains the streamers
    //     //name and the partner badge
    //     if (window.location.href.includes("tarik")) {
    //         parentDiv.appendChild(duoDiv);
    //     }

    //     await addTagToSidebar(secondSpanArray);
    // } // end of if statement checking if duo command had a response
    // // } //end of checking if were on tariks url even
};

//run main when page is loaded
window.onload = () => {
    console.log("page loaded-------");
    main();
};

//since twitch is a SPA we need to monitor the url for changes since it does not trigger reloads when navigating to a new page
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        onUrlChange();
    }
}).observe(document, { subtree: true, childList: true });

async function onUrlChange() {
    console.log("URL changed!", location.href);
    var newStreamerName = document.getElementsByTagName("h1")[0].innerText;

    //we do this loop becuase the way the observer is setup is the new html isnt loaded when the obeserver is called
    //which leads to us calling main and getting the old dom nodes thus we can append the tag
    //so we loop until the new streamer name is different from the old streamer name and then recall main
    while (newStreamerName === currentStreamer) {
        console.log("waiting for new streamer name");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        newStreamerName = document.getElementsByTagName("h1")[0].innerText;
    }

    main();
}

//every 10 minutes check for new duo update
setInterval(() => {
    main();
}, 600000);
