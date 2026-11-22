import type { HTMLAttributes } from 'react';
import styles from './List.module.css';

type Props = HTMLAttributes<HTMLUListElement | HTMLOListElement> & {
    as?: 'ul' | 'ol';
    variant?: 'plain' | 'bulleted' | 'numbered';
};

export const List = ({ as = 'ul', variant = 'plain', className, ...rest }: Props) => {
    const classes = [styles.list, styles[variant], className].filter(Boolean).join(' ');
    if (as === 'ol') {
        return <ol className={classes} {...(rest as HTMLAttributes<HTMLOListElement>)} />;
    }
    return <ul className={classes} {...(rest as HTMLAttributes<HTMLUListElement>)} />;
};
