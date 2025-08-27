type ButtonProps = {
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  text?: string;
};

function Button({
  type = "button",
  onClick,
  disabled = false,
  text = "hello",
}: ButtonProps) {
  return (
    <button
      type={type}
      className="rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 px-5 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-400"
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </button>
  );
}

export default Button;
