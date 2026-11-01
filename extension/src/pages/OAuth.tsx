import Card from "@/components/Card"
import Button from "@/components/Button";
import { useState, useEffect } from "react";

export default function OAuth() {
    const [message, setMessage] = useState("");
    const [connectedGoogle, setConnectedGoogle] = useState(false);

    // on load, try to connect
    useEffect(() => {
        connectGoogle();
    }, [])

    useEffect(() => {
        if (connectedGoogle) {
            setMessage("Google account is linked");
        }
        else {
            setMessage("Google account is not linked");
        }
    }, [connectedGoogle])

    async function connectGoogle() {
        const auth = await browser.runtime.sendMessage({
            type: "GOOGLE_AUTH",
        })
        if (auth.error) {
            setConnectedGoogle(false);
            console.error(auth.error);
        }
        else {
            setConnectedGoogle(true);
        }
    }

    async function disconnectGoogle() {
        const result = await browser.runtime.sendMessage({
            type: "LOGOUT_GOOGLE"
        })
        if (result.success) {
            setConnectedGoogle(false);
        }
        else {
            setConnectedGoogle(true);
        }
    }

    // Example of how to call the Gmail API using the oauth token

    // async function getLabels() {
    //     try {
    //         const auth = await browser.runtime.sendMessage({
    //             type: "GOOGLE_AUTH",
    //         })

    //         if (auth.error) {
    //             throw new Error(auth.error);
    //         }

    //         const res = await fetch(
    //             "https://gmail.googleapis.com/gmail/v1/users/me/labels", // just list all the labels in console for now, can do more later
    //             {
    //                 headers: {
    //                     Authorization: `Bearer ${auth.accessToken}`,
    //                 }
    //             }
    //         )

    //         if (!res.ok) {
    //             setMessage("Connecting Google Account did not work");
    //             throw new Error(`Google API error ${res.status}`);
    //         }

    //         const data = await res.json();
    //         setMessage("Successfully connected Google Account");
    //         console.log(data);
    //     }
    //     catch (error) {
    //         console.error("Google oauth attempt failed: ", error);
    //     }
    // }

    return (
        <Card variant="secondary">
            <p>{String(message)}</p>
            {connectedGoogle ? 
                <Button variant="secondary" size="sm" onClick={disconnectGoogle}>Disconnect your Google Account</Button> :
                <Button variant="secondary" size="sm" onClick={connectGoogle}>Connect a Google Account</Button>
            }
        </Card>
    )
}