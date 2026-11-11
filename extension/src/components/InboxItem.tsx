import { type Email } from "@/lib/gmailApi"

interface InboxItemProps {
    email: Email
    trash: (id: string) => Promise<void>,
    archive: (id: string) => Promise<void>,
    relabel: (id: string) => Promise<void>,
}

export default function InboxItem({email, trash, archive, relabel} : InboxItemProps) {
    return (
        <div className="flex flex-row">
            <div className="flex flex-col">
                <div>{email.subject}</div>
                <div>{email.from}</div>
            </div>
            <div className="flex flex-row">
                <button>A</button>
                <button onClick={()=>trash(email.id)}>D</button>
                <button>R</button>
            </div>
        </div>
    )
}