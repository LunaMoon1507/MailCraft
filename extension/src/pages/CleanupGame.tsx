import { useState, useEffect } from "react";
import Card from "@/components/Card"
import InboxItem from "@/components/InboxItem";
import { getEmails, getLabels, type Email, type Label, trashEmail } from "@/lib/gmailApi";

export default function CleanupGame() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [labels, setLabels] = useState<Label[]>([]);

    async function fetchEmailData() {
        const emailList = await getEmails();
        setEmails(emailList)
        const labelList = await getLabels();
        setLabels(labelList);
    }

    const removeEmailFromList = (id: string) => {
        const updatedEmails = emails.filter((email) => email.id != id)
        setEmails(updatedEmails);
    }

    async function trash(id: string) {
        const result = await trashEmail(id);
        if (!result) {
            console.log("ERROR")
        }
        else {
            removeEmailFromList(id);
        }
    }

    async function relabel(id: string) {
        return;
    }

    async function archive(id: string) {
        return;
    }

    useEffect(()=> {
        fetchEmailData();
        getLabels();
    }, [])

    return (
        <Card variant="primary" className="max-w-full">
            <div>
                {labels.map((label) => 
                    <div key={label.name}>{label.name}</div>
                    )
                }
            </div>
            <div className="flex flex-col gap-2">
                {emails.map((email: Email)=>
                    <InboxItem key={email.id} email={email} relabel={relabel} archive={archive} trash={trash}/>
                )}
            </div>
            
        </Card>
    )
}

// list (to get the list of all)

// modify to change labels
// trash (able to undo if made mistake)
//
