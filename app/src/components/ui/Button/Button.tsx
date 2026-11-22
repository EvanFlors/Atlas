import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'ghost'
type Syze = 'sm' | 'md'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant
    size?: Syze
}

export function Button({
    variant = 'primary',
    size = 'md',
    className,
    type = 'button',
    ...rest
}: Props) {
    const classes = [styles.base, styles[variant], styles[size], className].filter(Boolean).join(' ')
    return <button type={type} className={classes} {...rest} />
}