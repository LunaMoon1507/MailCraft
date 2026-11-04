import { useState, useEffect } from "react";
import Card from "@/components/Card"
import InboxItem from "@/components/InboxItem";
import { getEmails, type Email } from "@/lib/gmailApi";

export default function CleanupGame() {
    const [emails, setEmails] = useState<Email[]>([]);

    async function fetchEmails() {
        const emailList = await getEmails();
        setEmails(emailList)
    }

    useEffect(()=> {
        fetchEmails();
    })

    return (
        <Card variant="primary" className="max-w-full">
            <div>
                {emails.map((email: Email)=>
                    <InboxItem email={email}/>
                )}
            </div>
            
        </Card>
    )
}

// list (to get the list of all)

// modify to change labels
// trash (able to undo if made mistake)
//
