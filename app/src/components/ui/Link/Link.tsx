import type { AnchorHTMLAttributes } from 'react';
import { Link as RouterLink, type LinkProps as RouterLinkProps } from 'react-router-dom';
import styles from './Link.module.css';

type InternalProps = { external?: false } & RouterLinkProps;
type ExternalProps = { external: true; href: string } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    'href'
>;
type Props = InternalProps | ExternalProps;

export function Link(props: Props) {
    if (props.external) {
        const { external: _ext, className, ...rest } = props;
        return (
            <a
                {...rest}
                className={[styles.base, className].filter(Boolean).join(' ')}
                target="_blank"
                rel="noopener noreferrer"
            />
        );
    }

    const { external: _ext, className, ...rest } = props;
    return (
        <RouterLink
            {...(rest as RouterLinkProps)}
            className={[styles.base, className].filter(Boolean).join(' ')}
        />
    );
}
