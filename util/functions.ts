import type { CustomSpan } from "./types";
import { Storage } from "@plasmohq/storage";
//hits the 7tv api to check if the text is an emote
//We use 7tv because it returns also BTTV and FFZ emotes

const checkForEmotes = async (textArray: CustomSpan[]) => {
    const response = await fetch("https://api.7tv.app/v2/gql", {
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
        }),
    });

    const headers = {
        Authorization: `Bearer ${process.env.PLASMO_PUBLIC_BEARER}`,
        "Client-Id": `${process.env.PLASMO_PUBLIC_TWITCH_CLIENT_ID}`,
    };
    const twitchEmoteResponse = await fetch(
        "https://api.twitch.tv/helix/chat/emotes/global",
        { headers },
    );
    const twitchEmoteData = await twitchEmoteResponse.json();

    const twitchChannelEmoteResponse = await fetch(
        "https://api.twitch.tv/helix/chat/emotes?broadcaster_id=36340781",
        { headers },
    );

    const twitchChannelEmoteData = await twitchChannelEmoteResponse.json();

    //gets twitch users id

    // const twitchuseridtest = await fetch(
    //     "https://api.twitch.tv/helix/users?login=tarik",
    //     {
    //         headers,
    //     },
    // );
    // const twitchuseridtestData = await twitchuseridtest.json();
    // console.log("twitch user", twitchuseridtestData);

    console.log("twitch emote data", twitchEmoteData);

    const data = await response.json();
    const emotes = data["data"]["user"]["emotes"];
    const thirdPartyEmotes = data["data"]["user"]["third_party_emotes"];
    const emotesArray = emotes.concat(thirdPartyEmotes);

    //this loop checks emotes for bttv, ffz, and 7tv
    for (const emote of emotesArray) {
        for (const word of textArray) {
            if (emote.name == word.text) {
                console.log("emote found", emote.urls[0][1]);
                word.isEmote = true;
                word.url = emote.urls[0][1];
            }
        }
    }

    //this loop checks emotes for twitch global emotes
    for (const emote of twitchEmoteData.data) {
        for (const word of textArray) {
            if (emote.name == word.text) {
                console.log("emote found", emote.images["url_1x"]);
                word.isEmote = true;
                word.url = emote.images["url_1x"];
            }
        }
    }
    //this loop checks emotes for twitch global channel emotes
    for (const emote of twitchChannelEmoteData.data) {
        for (const word of textArray) {
            if (emote.name == word.text) {
                console.log("emote found", emote.images["url_1x"]);
                word.isEmote = true;
                word.url = emote.images["url_1x"];
            }
        }
    }

    console.log("checkForEmotes", textArray);
    return textArray;
};

const createSpans = (textArray: CustomSpan[]) => {
    const spans = [] as HTMLSpanElement[];
    for (const word of textArray) {
        const span = document.createElement("span");
        //had to do this since space wasnt being recognized as a word
        //causing the text to all be smooshed together
        span.style.marginRight = "4px";

        if (word.isEmote) {
            span.style.width = "28px";
            span.style.height = "28px";
            span.className = "emote-span";
            const img = document.createElement("img");
            img.src = word.url;
            span.appendChild(img);
        } else {
            span.innerText = word.text;
        }
        spans.push(span);
    }

    return spans;
};

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

const addTagToSidebar = async (duoSpans: HTMLSpanElement[]) => {
    console.log("addTagToSidebar", duoSpans);
    var twitchSidebar = document.getElementsByClassName("side-nav-card__title");
    while (twitchSidebar.length === 0) {
        console.log("waiting for sidebar");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        twitchSidebar = document.getElementsByClassName("side-nav-card__title");
    }

    const masterSpan = document.createElement("span");
    masterSpan.id = "duo-sidebar-tag";
    masterSpan.style.color = "rgb(209, 209, 209)";
    masterSpan.style.fontSize = "12px";
    masterSpan.style.display = "flex";
    masterSpan.style.alignItems = "center";

    const andSpan = document.createElement("span");
    andSpan.innerText = " & ";

    masterSpan.appendChild(andSpan);
    for (const span of duoSpans) {
        if (span.className.includes("emote-span")) {
            console.log("emote span found!");
            const tempImg = span.firstChild as HTMLImageElement;
            tempImg.style.transform = "scale(0.8)";
        }
        masterSpan.appendChild(span);
    }

    const doesSidebarTagExist = document.getElementById("duo-sidebar-tag");

    //removing our custom tage before we inject it again
    if (doesSidebarTagExist) {
        doesSidebarTagExist.remove();
    }

    console.log("sidebar found");
    for (const div of twitchSidebar) {
        const pTag = div.firstChild as HTMLParagraphElement;

        if (pTag.innerText.toLowerCase().includes("tarik")) {
            pTag.style.display = "flex";
            pTag.style.alignItems = "center";

            pTag.appendChild(masterSpan);
        }
    }
};

const getFossabotCommand = async (commandName: string): Promise<
    string | null
> => {
    //we hit the fossabot api before anything else so we can insant load the data when were ready
    const response = await fetch(
        //this is url for tariks fossabot command
        "https://api.fossabot.com/v2/cached/channels/301974676268695552/commands",
    );
    const data = await response.json();
    const commands = data["commands"];

    //look through all the commands from fossabot if a command exists
    for (const command of commands) {
        if (command.name === commandName) {
            return command.response;
        }
    }

    return null;
};

const createTag = (label: string) => {
    //if theme is dark it is 1
    //if theme is light it is 0
    const theme = localStorage.getItem("twilight.theme");
    console.log("theme----", theme);

    var tempDiv = document.createElement("div");
    tempDiv.id = `${label}-div`;
    tempDiv.style.marginLeft = "8px";
    tempDiv.style.fontWeight = "bold";
    tempDiv.style.padding = "4px";
    tempDiv.style.fontSize = "14px";
    tempDiv.style.borderRadius = "4px";
    // tempDiv.style.backgroundColor = "orange";
    tempDiv.style.backgroundColor = "rgb(222, 222, 223)";
    tempDiv.style.color = "rgb(66, 66, 66)";
    tempDiv.style.display = "flex";
    tempDiv.style.alignItems = "center";
    tempDiv.style.height = "36px";
    if (theme === "1") {
        console.log("theme is dark");
        // tempDiv.style.backgroundColor = "blue";
        tempDiv.style.backgroundColor = "rgb(50,50,50)";
        tempDiv.style.color = "rgb(99, 99, 102)";
    }

    const labelSpan = document.createElement("span");

    labelSpan.innerText = `${label}: `;
    labelSpan.style.textTransform = "capitalize";
    tempDiv.appendChild(labelSpan);

    return tempDiv;
};

const addTagToPage = async (label: string) => {
    const storage = new Storage();
    const showDuoInSidebar = await storage.get<boolean>("showSideBarInfo");
    console.log("addTagToPage", label);
    let commandResponse = await getFossabotCommand(label);
    //this is so we can send a seperate array to get added to the sidebar
    //i had to do this because i was runnign into some issues with shallow copying the array
    let spanArrayForSidebar: null | HTMLSpanElement[] = null;
    if (commandResponse !== null) {
        //create an array filled with objects that break up each word so we can check for emotes
        const textArray = splitIntoSpans(commandResponse);
        //check for emotes and update the objects value if we find one
        const checkedForEmotesArray = await checkForEmotes(textArray);
        //for each word/emote in the array create a span
        const spanArrayForTag = createSpans(checkedForEmotesArray);

        //if the command is duo lets also create an spanArray to add to sidebar

        if (showDuoInSidebar) {
            if (label === "duo") {
                spanArrayForSidebar = createSpans(checkedForEmotesArray);
                await addTagToSidebar(spanArrayForSidebar);
            }
        }

        //we now grab the information from the dom to append our custom tag
        var streamerName = document.getElementsByTagName("h1")[0];
        while (!streamerName) {
            streamerName = document.getElementsByTagName("h1")[0];
            console.log("waiting for streamer name");
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        //div that contains the streamers name and partner badge
        const parentDiv = streamerName.parentElement.parentElement;

        //checking if weve already injecting our custom tag
        const doesDivExistAlready = document.getElementById(`${label}-div`);

        //if weve already injected our custom tag we remove it
        if (doesDivExistAlready) {
            doesDivExistAlready.remove();
        }

        //this is the div that will contain all spans
        var tagDiv = createTag(label);
        for (const span of spanArrayForTag) {
            tagDiv.appendChild(span);
        }

        //we append the duo div to the parent div which is the div that originally contains the streamers
        //name and the partner badge
        if (window.location.href.includes("tarik")) {
            parentDiv.appendChild(tagDiv);
        }
    }
};

export {
    checkForEmotes,
    createSpans,
    splitIntoSpans,
    addTagToSidebar,
    getFossabotCommand,
    createTag,
    addTagToPage,
};
