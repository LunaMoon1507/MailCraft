import { useState } from 'react';
import { API_URL, getHealth } from '@/lib/api';
import Button from '@/components/Button';
import Card from '@/components/Card';
import TextInput from '@/components/TextInput';

export default function Login () {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [displayLogin, setDisplayLogin] = useState(false);
    const [usernameError, setUsernameError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const handleLogin = () => {
        console.log("Login Clicked");
    }
    const handleSignup = () => {
        console.log("Sign Up Clicked!");
    }

    return(
        <Card variant="secondary">
            <TextInput updateValue={setUsername} error={usernameError} label="Username"/>
            <TextInput type="password" updateValue={setPassword} error={passwordError} label="Password"/>
            {displayLogin ?
                <Button variant="secondary" size="sm" onClick={handleLogin}>Login</Button>
                :
                <Button variant="secondary" size="sm" onClick={handleSignup}>Sign Up</Button>
                }
            <div className="text-sm underline" onClick={()=>setDisplayLogin(!displayLogin)}>
                {displayLogin ? "No account? Sign up!" : "Already have an account? Log in!"}
            </div>
        </Card>
    )
}