import type { ChangeEvent } from "react";

type TextInputProps = {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
};

function TextInput({ value, onChange, placeholder = "" }: TextInputProps) {
  return (
    <input
      type="input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    ></input>
  );
}

export default TextInput;
