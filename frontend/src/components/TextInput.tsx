import type { ChangeEvent } from "react";

type TextInputProps = {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
};

function TextInput({ value, onChange, placeholder = "" }: TextInputProps) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="me-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-300"
    ></input>
  );
}

export default TextInput;
