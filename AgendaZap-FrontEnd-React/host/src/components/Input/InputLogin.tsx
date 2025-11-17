import "./InputLogin.css"

type TinputLogin = {
    placeholder: string;
    tipo: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const InputLogin: React.FC<TinputLogin> = ({ placeholder, tipo, onChange }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e);
    }

    return (
        <input className="input" required placeholder={placeholder} type={tipo} onChange={e => handleChange(e)} />
    )
}
