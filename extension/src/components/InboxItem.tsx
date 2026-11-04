import { type Email } from "@/lib/gmailApi"

interface InboxItemProps {
    email: Email
}

export default function InboxItem({email} : InboxItemProps) {
    return (
        <div className="flex flex-row">
            <div className="flex flex-col">
                <div>{email.subject}</div>
                <div>{email.from}</div>
            </div>
            <div className="flex flex-row">
                <button>A</button>
                <button>D</button>
                <button>R</button>
            </div>
        </div>
    )
}