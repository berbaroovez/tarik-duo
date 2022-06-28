import type { PlasmoContentScript } from "plasmo";

export const config: PlasmoContentScript = {
    matches: ["https://www.twitch.tv/*"],
};

var currentStreamer = "";

const main = async () => {
    const theme = localStorage.getItem("twilight.theme");
    console.log("theme", theme);
    //if theme is dark it is 1

    var streamerName = document.getElementsByTagName("h1")[0];
    console.log("query", streamerName);
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

    const res = await fetch(
        "https://api.fossabot.com/v2/cached/channels/301974676268695552/commands",
    );
    const data = await res.json();
    const commands = data["commands"];
    var duoCommandResponse = "";
    for (const command of commands) {
        if (command.name === "duo") {
            console.log(command.name);
            console.log(command.response);

            duoCommandResponse = command.response;
        }
    }

    var spanArray: HTMLSpanElement[] = [];
    if (duoCommandResponse !== "") {
        const textArray = splitIntoSpans(duoCommandResponse);
        const updatedTextArray = await checkForEmotes(textArray);
        spanArray = createSpans(updatedTextArray);
    }

    while (!streamerName) {
        streamerName = document.getElementsByTagName("h1")[0];

        console.log("streamName", streamerName);
        console.log("waiting for streamer name");
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    currentStreamer = streamerName.innerText;
    const parentDiv = streamerName.parentElement.parentElement;
    if (window.location.href.includes("/tarik")) {
        console.log(
            "trent fps detected-------------------------------------------------",
        );
        const outerImgSpan = document.createElement("span");
        outerImgSpan.style.height = "28px";
        outerImgSpan.style.width = "28px";
        const emoteImg = document.createElement("img");
        emoteImg.src =
            "https://cdn.betterttv.net/emote/56c2cff2d9ec6bf744247bf1/1x";

        const doesDuoDivExistFromBefore = document.getElementById("duo-div");

        //since we run a loop to check for a new duo periodically we need to remove the old dive before adding the new one
        if (doesDuoDivExistFromBefore) {
            doesDuoDivExistFromBefore.remove();
        }

        const tempSpan = document.createElement("span");
        tempSpan.innerText = "Duo: ";
        duoDiv.appendChild(tempSpan);
        for (const span of spanArray) {
            duoDiv.appendChild(span);
        }
        parentDiv.appendChild(duoDiv);
    }
};

window.onload =
    () => {
        console.log("page loaded-------");
        // var streamerName = document.getElementsByTagName("h1")[0];
        // console.log("querywooooo", streamerName);
        main();
    };

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
    600000,
);
