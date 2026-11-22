import type { HTMLAttributes } from 'react';
import styles from './Card.module.css';

type Props = HTMLAttributes<HTMLDivElement>;

export function Card(props: Props) {
    const { className, ...rest } = props;
    return (
        <div
            className={[styles.base, className].filter(Boolean).join(' ')}
            {...rest}
        />
    );
}