import { type Email } from "@/lib/gmailApi"
import { useState } from "react"
import Card from "./Card"
import Button from "./Button"

interface InboxItemProps {
    email: Email
    trash: (id: string) => Promise<void>,
    archive: (id: string) => Promise<void>,
    relabel: (id: string) => Promise<void>,
    skip: (id: string) => void,
}

export default function InboxItem({email, trash, archive, relabel, skip} : InboxItemProps) {
    const [archiveLoading, setArchiveLoading] = useState(false);
    const [relabelLoading, setRelabelLoading] = useState(false);
    const [trashLoading, setTrashLoading] = useState(false);

    const handleArchiveClick = async () => {
        setArchiveLoading(true);
        try {
            const res = await archive(email.id);
        }
        finally {
            setArchiveLoading(false);
        }
    }

    const handleRelabelClick = async () => {
        setRelabelLoading(true);
        try {
            const res = await relabel(email.id);
        }
        finally {
            setRelabelLoading(false);
        }
    }

    const handleTrashClick = async () => {
        setTrashLoading(true);
        try {
            const res = await trash(email.id);
        }
        finally {
            setTrashLoading(false);
        }
    }

    return (
        <Card variant="plain" className="group relative">
            <div className="flex flex-col justify-between gap-2 max-w-full">
                <div className="flex flex-col">
                    <div className="break-words">{email.subject}</div>
                    <div className="break-words">{email.from}</div>
                </div>
            </div>
            <div className="absolute inset-0 opacity-0 bg-black/40 group-hover:opacity-100 flex flex-col justify-center">
                <div className="flex flex-row gap-2 max-h-min justify-center">
                    <Button variant="primary" size="sm" loading={archiveLoading} onClick={handleArchiveClick}>Archive</Button>
                    <Button variant="primary" size="sm" loading={relabelLoading} onClick={handleRelabelClick}>Relabel</Button>
                    <Button variant="danger" size="sm" loading={trashLoading} onClick={handleTrashClick}>Trash</Button>
                    <Button variant="secondary" size="sm" onClick={()=>skip(email.id)}>Skip</Button>
                </div> 
            </div>
        </Card>
    )
}