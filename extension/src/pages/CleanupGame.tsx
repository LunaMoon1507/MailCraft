import { useState, useEffect } from "react";
import Card from "@/components/Card"
import InboxItem from "@/components/InboxItem";
import { getEmails, getLabels, type Email, type Label, trashEmail, relabelEmail, archiveEmail } from "@/lib/gmailApi";
import { awardPoints } from "@/lib/api";

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
            console.log("ERROR with trash")
        }
        else {
            try {
                const points = await awardPoints("DELETE");
                removeEmailFromList(id);
            }
            catch {
                console.log("Error when awarding points")
            }
        }
    }

    async function relabel(id: string, labelId: string) {
        const result = await relabelEmail(id, labelId)
        if (!result) {
            console.log("ERROR with relabel")
        }
        else {
            try {
                const points = await awardPoints("LABEL");
                removeEmailFromList(id);
            }
            catch {
                console.log("Error when awarding points")
            }
            
        }
    }

    async function archive(id: string) {
        const result = await archiveEmail(id)
        if (!result) {
            console.log("ERROR with archive")
        }
        else {
            try {
                const points = await awardPoints("ARCHIVE");
                removeEmailFromList(id);
            }
            catch {
                console.log("Error when awarding points")
            }
        }
    }

    useEffect(()=> {
        fetchEmailData();
        getLabels();
    }, [])

    return (
        <Card variant="secondary" className="max-w-full">
            <div>
                {labels.map((label) => 
                    <div key={label.name}>{label.name}</div>
                    )
                }
            </div>
            <div className="flex flex-col gap-4">
                {emails.map((email: Email)=>
                    <InboxItem key={email.id} email={email} relabel={relabel} archive={archive} trash={trash} skip={removeEmailFromList}/>
                )}
            </div>
            
        </Card>
    )
}

// list (to get the list of all)

// modify to change labels
// trash (able to undo if made mistake)
//
