//TODO: Steralize emote data into a single type
interface bttvEmote {
    id: string;
    code: string;
    imageType: string;
    userId?: string;
    user?: bttvUser;
}
interface ffzEmote {
    id: string;
    name: string;
    height: number;
    width: number;
    public: boolean;
    hidden: boolean;
    modifer: boolean;
    offset: null;
    margin: null;
    css: null;
    owner: ffzOwner;
    urls: ffzURLS;
    status: number;
    usage_count: number;
    created_at: string;
    last_updated: string;
}
interface ffzOwner {
    _id: string;
    name: string;
    display_name: string;
}
interface ffzURLS {
    1: string;
    2: string;
    4: string;
}
interface bttvUser {
    displayName: string;
    id: string;
    name: string;
    providerId: string;
}

interface sevenTvEmote {
    id: string;
    name: string;
    visibility?: number;
    urls: [string, string][];
    height?: number[];
    width?: number[];
}

const getBttvEmotes = async (user_id: string): Promise<bttvEmote[]> => {
    const bttvResponse = await fetch(
        `https://api.betterttv.net/3/cached/users/twitch/${user_id}`,
    );
    const bttvData = await bttvResponse.json();
    const bttvChannelEmoteData: bttvEmote[] = bttvData["channelEmotes"];
    const bttvSharedEmoteData: bttvEmote[] = bttvData["sharedEmotes"];
    const bttvGlobalEmoteResponse = await fetch(
        "https://api.betterttv.net/3/cached/emotes/global",
    );
    const bttvGlobalEmoteData: bttvEmote[] =
        await bttvGlobalEmoteResponse.json();

    // console.log("bttv channel emote data", bttvChannelEmoteData);
    // console.log("bttv shared emote data", bttvSharedEmoteData);
    // console.log("bttv global emote data", bttvGlobalEmoteData);

    return [
        ...bttvChannelEmoteData,
        ...bttvSharedEmoteData,
        ...bttvGlobalEmoteData,
    ];
};

const getFFZEmotes = async (user_id: string): Promise<ffzEmote[]> => {
    let emotes: ffzEmote[] = [];
    const ffzResponse = await fetch(
        `https://api.frankerfacez.com/v1/room/id/${user_id}`,
    );
    const ffzData = await ffzResponse.json();
    const ffzSetsKet = Object.keys(ffzData["sets"]);
    for (const setKey of ffzSetsKet) {
        const set = ffzData["sets"][setKey].emoticons;
        emotes = [...emotes, ...set];
    }

    const ffzGlobalEmoteResponse = await fetch(
        "https://api.frankerfacez.com/v1/set/global",
    );
    const ffzGlobalEmoteData = await ffzGlobalEmoteResponse.json();

    //get keys and loop through them
    const ffzGlobalEmoteKeys = Object.keys(ffzGlobalEmoteData["sets"]);
    for (const key of ffzGlobalEmoteKeys) {
        const tempEmoteData = ffzGlobalEmoteData["sets"][key].emoticons;
        emotes = [...emotes, ...tempEmoteData];
    }

    // console.log("ffz emote data", ffzEmoteData);

    return emotes;
};

const get7TvEmotes = async (user_id: string): Promise<sevenTvEmote[]> => {
    let emotes: sevenTvEmote[] = [];
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
                    urls
                  
                  }
            }
          }
            `,
            variables: {
                id: user_id,
            },
        }),
    });

    const data = await response.json();
    emotes = [...emotes, ...data["data"]["user"]["emotes"]];

    const sevenTVGlobalEmotesResponse = await fetch(
        "https://api.7tv.app/v2/emotes/global",
    );
    const sevenTVGlobalEmotesData = await sevenTVGlobalEmotesResponse.json();
    emotes = [...emotes, ...sevenTVGlobalEmotesData];

    return emotes;
};

export { getBttvEmotes, getFFZEmotes, get7TvEmotes };
