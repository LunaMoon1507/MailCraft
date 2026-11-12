import { type Email } from "@/lib/gmailApi"
import Card from "./Card"
import Button from "./Button"

interface InboxItemProps {
    email: Email
    trash: (id: string) => Promise<void>,
    archive: (id: string) => Promise<void>,
    relabel: (id: string, labelId: string) => Promise<void>,
    skip: (id: string) => void,
}

export default function InboxItem({email, trash, archive, relabel, skip} : InboxItemProps) {
    return (
        <Card variant="primary" className="group relative">
            <div className="flex flex-col justify-between gap-2 max-w-full">
                <div className="flex flex-col">
                    <div className="break-words">{email.subject}</div>
                    <div className="break-words">{email.from}</div>
                </div>
            </div>
            <div className="absolute inset-0 opacity-0 bg-black/40 group-hover:opacity-100 flex flex-col justify-center">
                <div className="flex flex-row gap-2 max-h-min justify-center">
                    <Button variant="primary" size="sm" onClick={()=>archive(email.id)}>Archive</Button>
                    <Button variant="primary" size="sm">Relabel</Button>
                    <Button variant="danger" size="sm" onClick={()=>trash(email.id)}>Trash</Button>
                    <Button variant="secondary" size="sm" onClick={()=>skip(email.id)}>Skip</Button>
                </div> 
            </div>
        </Card>
    )
}