import { useState } from 'react';
import { login, register } from '@/lib/auth';
import Button from '@/components/Button';
import Card from '@/components/Card';
import TextInput from '@/components/TextInput';

export default function Login () {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [displayLogin, setDisplayLogin] = useState(false);
    const [usernameError, setUsernameError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const handleSwitchClick = () => {
        setDisplayLogin(!displayLogin);
        setUsernameError("");
        setPasswordError("");
    }

    async function handleLogin() {
        try {
            await login(username, password);
        }
        catch (error) {
            if (error instanceof Error) {
                setPasswordError(error.message);
            } else {
                setPasswordError("An unexpected error occurred.");
            }
        }
        setUsername("");
        setPassword("");
    }
    async function handleSignup() {
        if (password) {
            setPasswordError("");
        }
        else {
            setPasswordError("Password cannot be blank.");
        }
        if (username) {
            setUsernameError("");
        }
        else {
            setUsernameError("Username cannot be blank.");
        }

        if (username && password) {
            console.log("Sign Up Clicked!");
            try {
                await register(username, password);
            }
            catch (error) {
                if (error instanceof Error) {
                    setPasswordError(error.message);
                } else {
                    setPasswordError("An unexpected error occurred.");
                }
            }
        }
        setUsername("");
        setPassword("");
    }

    return(
        <Card variant="secondary">
            <TextInput updateValue={setUsername} value={username} error={usernameError} label="Username"/>
            <TextInput type="password" updateValue={setPassword} value={password} error={passwordError} label="Password"/>
            {displayLogin ?
                <Button variant="secondary" size="sm" onClick={handleLogin}>Login</Button>
                :
                <Button variant="secondary" size="sm" onClick={handleSignup}>Sign Up</Button>
                }
            <div className="text-sm underline" onClick={handleSwitchClick}>
                {displayLogin ? "No account? Sign up!" : "Already have an account? Log in!"}
            </div>
        </Card>
    )
}