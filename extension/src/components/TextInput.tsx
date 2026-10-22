import React, { type ComponentProps, useState } from "react";

// Extend native HTML input attributes to accept all standard input props automatically
export interface InputProps extends ComponentProps<"input"> {
  label: string;
  updateValue: Function;
  error?: string;
}

export default function TextInput({label, error, updateValue, children, ...props} : InputProps) {
    const [text, setText] = useState("");

    return(
        <div>
            <div className="text-sm">{label}</div>
            <input type="text" name={label} className="bg-night" onChange={(e)=> {setText(e.target.value); updateValue(e.target.value)}}{...props}></input>
            {error && (
                <p>{error}</p>
            )}
        </div>
    )
}
