import { Link } from 'react-router-dom'
import "./BotaoLink.css"
import { ReactNode } from 'react';

type TBotaoLink = {
    children: string | ReactNode;
    url: string
}

export const BotaoLink: React.FC<TBotaoLink> = ({ children, url }) => {
    return (
        <Link type='submit' className='BotaoLink' to={url}>{children}</Link>
    )
}
