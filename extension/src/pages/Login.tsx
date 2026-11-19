import { useState, type FormEvent } from 'react';
import { login, register } from '@/lib/auth';
import Button from '@/components/Button';
import Card from '@/components/Card';
import TextInput from '@/components/TextInput';

// Profile tab, signed out: create an account or log in.
// On success the stored token changes, so App swaps this for the profile.
export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [displayLogin, setDisplayLogin] = useState(false);
    const [usernameError, setUsernameError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [busy, setBusy] = useState(false);

    const handleSwitchClick = () => {
        setDisplayLogin(!displayLogin);
        setUsernameError("");
        setPasswordError("");
    }

    // A <form> so Enter submits from either field.
    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const name = username.trim();
        setUsernameError(name ? "" : "Username cannot be blank.");
        setPasswordError(password ? "" : "Password cannot be blank.");
        if (!name || !password) {
            return;
        }

        setBusy(true);
        try {
            if (displayLogin) {
                await login(name, password);
            } else {
                await register(name, password);
            }
        }
        catch (error) {
            setPasswordError(error instanceof Error ? error.message : "An unexpected error occurred.");
            // Keep the username so the user only has to retype the password.
            setPassword("");
        }
        finally {
            setBusy(false);
        }
    }

    return(
        <Card variant="primary" heading={displayLogin ? "Log in" : "Create account"}>
            {!displayLogin && <p className="mc-subtitle">Sign up to earn XP for every email you sort.</p>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-px3" noValidate>
                <TextInput updateValue={setUsername} value={username} error={usernameError} label="Username" autoComplete="username"/>
                <TextInput type="password" updateValue={setPassword} value={password} error={passwordError} label="Password" autoComplete={displayLogin ? "current-password" : "new-password"}/>
                <Button type="submit" variant="primary" size="md" block loading={busy} disabled={busy}>
                    {displayLogin ? "Log in" : "Sign up"}
                </Button>
            </form>
            <div>
                <button type="button" className="mc-link" onClick={handleSwitchClick}>
                    {displayLogin ? "No account? Sign up!" : "Already have an account? Log in!"}
                </button>
            </div>
        </Card>
    )
}
