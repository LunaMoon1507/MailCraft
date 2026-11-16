import { useState, useEffect } from "react";
import Card from "@/components/Card"
import InboxItem from "@/components/InboxItem";
import { CreatableDropdown } from "@/components/CreatableDropdown";
import { getEmails, getLabels, createLabel, type Email, type Label, trashEmail, relabelEmail, archiveEmail } from "@/lib/gmailApi";
import { awardPoints } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function CleanupGame() {
    const {isAuthenticated} = useAuth();

    const [emails, setEmails] = useState<Email[]>([]);
    const [labels, setLabels] = useState<Label[]>([]);
    const [selectedLabelId, setSelectedLabelId] = useState("");
    const [popupMessage, setPopupMessage] = useState("");

    // for the dropdown menu
    async function addLabel(name: string) {
        if (!labels.find(label => label.name == name)) {
            const res = await createLabel(name);

            if (res) {
                setSelectedLabelId(res.id);
                fetchLabels();
                return true;
            }
        }
        return false;
    }

    async function fetchEmails() {
        const emailList = await getEmails();
        if (emailList.length == 0) {
            setPopupMessage("No more emails to clean up, good job!");
        }
        setEmails(emailList)
    }

    async function fetchLabels() {
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
            setPopupMessage("An error occurred, please try again!")
        }
        else {
            try {
                const points = await awardPoints("DELETE");
                setPopupMessage(`+${points.awardedPoints} xp`)
                removeEmailFromList(id);
            }
            catch {
                console.log("Error when awarding points")
            }
        }
    }

    async function relabel(id: string) {
        if (!selectedLabelId) {
            setPopupMessage("Please select a label first!")
            return;
        }

        const result = await relabelEmail(id, selectedLabelId)
        if (!result) {
            setPopupMessage("An error occurred, please try again!")
        }
        else {
            try {
                const points = await awardPoints("LABEL");
                setPopupMessage(`+${points.awardedPoints} xp`)
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
            setPopupMessage("An error occurred, please try again!")
        }
        else {
            try {
                const points = await awardPoints("ARCHIVE");
                setPopupMessage(`+${points.awardedPoints} xp`)
                removeEmailFromList(id);
            }
            catch {
                console.log("Error when awarding points")
            }
        }
    }

    useEffect(()=> {
        fetchEmails();
        fetchLabels();
    }, [])

    useEffect(()=> {
        if (!popupMessage) {
            return;
        }

        const timer = setTimeout(() => {
        setPopupMessage("");
        }, 1000);


    }, [popupMessage])

    if (!isAuthenticated) {
        return <Card variant="secondary" className="max-w-full" heading="Email Cleanup">
            <div>Log in to earn points for cleaning your emails!</div>
            </Card>
    }

    return (
        <Card variant="secondary" className="max-w-full" heading="Email Cleanup">
            <div>
                Current Label for Relabeling:
                <CreatableDropdown onChangeId={setSelectedLabelId} onCreate={addLabel} items={labels.filter(label=>label.id.startsWith("Label"))}></CreatableDropdown>
            </div>
            {popupMessage && <div className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black px-6 py-4 text-center text-white">
                {popupMessage}
            </div>
            }
            <div className="flex flex-col gap-4">
                {emails.map((email: Email)=>
                    <InboxItem key={email.id} email={email} relabel={relabel} archive={archive} trash={trash} skip={removeEmailFromList}/>
                )}
            </div> 
            {
                emails.length == 0 &&
                <Button variant="primary" onClick={fetchEmails}>Load more emails</Button>
            }
        </Card>
    )
}
