// interfaces for the data returned by Gmail API

// data returned by the list api call
interface ListResult {
    messages: {
        id: string,
        threadId: string
    }[],
    nextPageToken: string,
    resultSizeEstimate: number
}

// data returned by the get (single email) api call
interface EmailRawData {
    id: string,
    labelIds: string[], // ex: UNREAD, INBOX, CATEGORY_PROMOTIONS, CATEGORY_UPDATES, numbers for custom labels
    payload: {
        headers: {name: string, value: string}[] // relevant headers: From, Subject, Date
    }
}

export interface Label {
    id: string,
    name: string,
    // "system" (INBOX, SPAM, CATEGORY_*...) or "user" (labels the user made)
    type?: "system" | "user",
}

// How many inbox emails one cleanup batch loads.
export const BATCH_SIZE = 25;

interface LabelListRawData {
    labels: Label[]
}

// info to display on frontend
export interface Email {
    id: string,
    labelIds: string[],
    from: string,
    subject: string,
}

// Calls to the Gmail API

async function getGoogleAPIToken() {
    const authResult = await browser.identity.getAuthToken({
        interactive: false,
    });

    return authResult.token;
}

// helper function for any gmail api calls
// automatically adds the authorization header
async function fetchGmail(url: URL, options: RequestInit = {}) {
    const googleToken = await getGoogleAPIToken();
    if (!googleToken) {
        throw new Error("No connection to Google OAuth.")
    }
    const res = await fetch(url, {
        ...options,
        headers: {
        ...options.headers,
        Authorization: `Bearer ${googleToken}`,
        },
    })

    return res;
}

// get list of email IDs
async function getEmailList() {
    console.log("getting emails");

    const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    const params = { 
        maxResults: String(BATCH_SIZE),
        includeSpamTrash: "false",
        labelIds: "INBOX",
    };
    url.search = new URLSearchParams(params).toString();

    const res = await fetchGmail(url, {
        method: "GET",
    })

    if (!res.ok) {
        throw new Error(`Google API error ${res.status}`);
    }

    const data = await res.json() as ListResult;  
    return data;
}

// gets one email by id
async function getEmail(id: string) {
    const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`)
    const params = {
        format: "METADATA",
    }
    url.search = new URLSearchParams(params).toString()

    const res = await fetchGmail(url, {
        method: "GET",
    })

    if (!res.ok) {
        throw new Error(`Google API error ${res.status}`);
    }

    const data = await res.json() as EmailRawData;
    return data
}


async function processEmails(emailList: ListResult) {
    // Gmail leaves out `messages` entirely when the inbox is empty.
    const promises = (emailList.messages ?? []).map(async (message) => {
        const email = await getEmail(message.id)

        return email
    })

    const emails = await Promise.all(promises);

    // keep only the info needed to display: lablels, from, subject
    const mappedEmails: Email[] = emails.map((email) => ({
        id: email.id,
        labelIds: email.labelIds,
        from: email.payload.headers.find(
            (h) => h.name.toLowerCase() === "from"
        )?.value ?? "",
        subject: email.payload.headers.find(
            (h) => h.name.toLowerCase() === "subject"
        )?.value ?? ""
    }));

    console.log(mappedEmails)
    return mappedEmails
}

export async function getEmails() {
    const emailList = await getEmailList();
    const emails = await processEmails(emailList);
    return emails;
}

export async function getLabels() {
    const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/labels")
    const labelRes = await fetchGmail(url, {
        method: "GET",
    })

    if (!labelRes.ok) {
        throw new Error("Error fetching labels form Gmail API");
    }

    const data = await labelRes.json() as LabelListRawData;
    const cleaned = data.labels.map((label) => ({
            id: label.id,
            name: label.name,
            type: label.type,
        })
    ) as Label[];
    console.log(cleaned)
    return cleaned;
}

export async function trashEmail(id: string) {
    const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/trash`)
    const trashRes = await fetchGmail(url, {
        method: "POST"
    })
    
    if (!trashRes.ok) {
        return false;
    }

    const data = await trashRes.json();

    console.log(data);

    return true;
}

export async function archiveEmail(id: string) {
    const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`)
    const archiveRes = await fetchGmail(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            removeLabelIds: ["INBOX"],
        }),
    })

    if (!archiveRes.ok) {
        return false;
    }

    const data = await archiveRes.json();

    console.log(data);

    return true;
}

export async function relabelEmail(id: string, newLabelId: string) {
    const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`)
    const relabelRes = await fetchGmail(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            removeLabelIds: ["INBOX"],
            addLabelIds: [newLabelId]
        }),
    })

    if (!relabelRes.ok) {
        return false;
    }

    const data = await relabelRes.json();

    console.log(data);

    return true;
}

export async function createLabel(labelName: string) {
    const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/labels`)
    const labelRes = await fetchGmail(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: labelName,
            messageListVisibility: "show",
            labelListVisibility: "labelShow"
        }),
    })

    if (!labelRes.ok) {
        return false;
    }

    const data = await labelRes.json();

    console.log(data);

    return data as Label;
}