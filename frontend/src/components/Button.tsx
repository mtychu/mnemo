type ButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
  text?: string;
};

function Button({ onClick, disabled = false, text = "hello" }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  );
}

export default Button;
