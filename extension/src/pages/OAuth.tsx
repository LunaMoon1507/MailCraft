import Card from "@/components/Card"
import Button from "@/components/Button";
import { useGoogleLink } from "@/hooks/useGoogleLink";

// Google (Gmail) link status. The logic lives in SessionContext so Cleanup
// can share it; this card will become a row of the Profile tab's
// Connections card in step 3 of the tabbed-UI plan.
export default function OAuth() {
    const { linked, checking, error, link, unlink } = useGoogleLink();

    return (
        <Card variant="secondary">
            <p role="status">
                {checking ? "Checking Google account..." : linked ? "Google account is linked" : "Google account is not linked"}
            </p>
            {error && <p className="mc-error">{error}</p>}
            {linked ?
                <Button variant="secondary" size="sm" disabled={checking} onClick={() => void unlink()}>Disconnect your Google Account</Button> :
                <Button variant="secondary" size="sm" disabled={checking} onClick={() => void link()}>Connect a Google Account</Button>
            }
        </Card>
    )
}
