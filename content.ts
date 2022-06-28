import type { PlasmoContentScript } from "plasmo";

export const config: PlasmoContentScript = {
    matches: ["https://www.twitch.tv/*"],
};

var currentStreamer = "";

const main = async () => {
    // if (window.location.href.includes("tarik")) {
    //if theme is dark it is 1
    //if theme is light it is 0
    const theme = localStorage.getItem("twilight.theme");

    //we hit the fossabot api before anything else so we can insant load the data when were ready
    const res = await fetch(
        "https://api.fossabot.com/v2/cached/channels/301974676268695552/commands",
    );
    const data = await res.json();
    const commands = data["commands"];
    var duoCommandResponse = "";

    //look through all the commands from fossabot and get the one for duo
    //we save the response for that command
    for (const command of commands) {
        if (command.name === "duo") {
            duoCommandResponse = command.response;
        }
    }

    var spanArray: HTMLSpanElement[] = [];

    //we now check to see if duo has any response
    if (duoCommandResponse !== "") {
        //break the text up into custom object
        const textArray = splitIntoSpans(duoCommandResponse);
        //each index of the array gets checked for if it is an emote
        const updatedTextArray = await checkForEmotes(textArray);
        //we not create spans for the array of objects
        //if it is text simply append the text to the span
        //if it is an emote we create an image and append it to the span
        spanArray = createSpans(updatedTextArray);

        //we now grab the information from the dom to append our custom tag
        var streamerName = document.getElementsByTagName("h1")[0];
        while (!streamerName) {
            streamerName = document.getElementsByTagName("h1")[0];
            console.log("waiting for streamer name");
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        //this is used for when the url changes and we need to insure the h1 is updated before we attempt to grab new data
        currentStreamer = streamerName.innerText;

        //div that contains the streamers name and partner badge
        const parentDiv = streamerName.parentElement.parentElement;

        //checking if weve already injecting our custom tag
        const doesDuoDivExistFromBefore = document.getElementById("duo-div");

        //removing our custom tage before we inject it again
        if (doesDuoDivExistFromBefore) {
            doesDuoDivExistFromBefore.remove();
        }

        //this is the div that will contain all spans
        var duoDiv = document.createElement("div");
        duoDiv.id = "duo-div";
        duoDiv.style.marginLeft = "8px";
        duoDiv.style.fontWeight = "bold";
        duoDiv.style.padding = "4px";
        duoDiv.style.fontSize = "14px";
        duoDiv.style.borderRadius = "4px";
        duoDiv.style.backgroundColor = "rgba(0,0,0,0.05)";
        duoDiv.style.color = "rgba(0,0,0,0.7)";
        duoDiv.style.display = "flex";
        duoDiv.style.alignItems = "center";
        if (theme === "1") {
            duoDiv.style.backgroundColor = "rgb(50,50,50)";
            duoDiv.style.color = "rgba(255, 255, 255,.5)";
        }

        const duoLabelSpan = document.createElement("span");
        duoLabelSpan.innerText = "Duo: ";
        duoDiv.appendChild(duoLabelSpan);

        //we take the array of spans we got from createSpans and append them all to the duo div

        for (const span of spanArray) {
            duoDiv.appendChild(span);
        }

        //we append the duo div to the parent div which is the div that originally contains the streamers
        //name and the partner badge
        if (window.location.href.includes("tarik")) {
            parentDiv.appendChild(duoDiv);
        }
    } // end of if statement checking if duo command had a response
    // } //end of checking if were on tariks url even
};

//run main when page is loaded
window.onload =
    () => {
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
},).observe(document, { subtree: true, childList: true });

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

interface CustomSpan {
    text: string;
    isEmote: boolean;
    url: string;
}

//we take a string and break it up into an array of custom objects
function splitIntoSpans(text) {
    console.log("splitIntoSpans");
    const textSpans = [] as CustomSpan[];
    const textArr = text.split(" ");
    for (let i = 0; i < textArr.length; i++) {
        const tempObject = {
            text: textArr[i],
            isEmote: false,
            url: "",
        };

        textSpans.push(tempObject);
    }

    return textSpans;
}

//hits the 7tv api to check if the text is an emote
//We use 7tv because it returns also BTTV and FFZ emotes
const checkForEmotes = async (textArray: CustomSpan[]) => {
    const response = await fetch(
        "https://api.7tv.app/v2/gql",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: `
          query GetUsersEmotes ($id: String!) {
            user(id:$id) { 
             emotes {
                    id
                    name
                    owner_id
                    urls
                    provider
                  }
              third_party_emotes {
                id
                name
                owner_id
                urls
                provider
              }
            }
          }
            `,
                variables: {
                    id: "36340781",
                },
            },),
        },
    );

    const data = await response.json();
    const emotes = data["data"]["user"]["emotes"];
    const thirdPartyEmotes = data["data"]["user"]["third_party_emotes"];
    const emotesArray = emotes.concat(thirdPartyEmotes);

    for (const emote of emotesArray) {
        for (const word of textArray) {
            if (emote.name == word.text) {
                console.log("emote found", emote.urls[0][1]);
                word.isEmote = true;
                word.url = emote.urls[0][1];
            }
        }
    }

    return textArray;
};

const createSpans = (textArray: CustomSpan[]) => {
    const spans = [] as HTMLSpanElement[];
    for (const word of textArray) {
        const span = document.createElement("span");

        if (word.isEmote) {
            span.style.width = "28px";
            span.style.height = "28px";
            const img = document.createElement("img");
            img.src = word.url;
            span.appendChild(img);
        } else {
            span.innerText = word.text + " ";
        }
        spans.push(span);
    }

    return spans;
};

//every 10 minutes check for new duo update
setInterval(
    () => {
        main();
    },
    60000,
);
