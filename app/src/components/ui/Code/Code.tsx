import type { HTMLAttributes } from 'react';
import styles from './Code.module.css';

type InlineProps = HTMLAttributes<HTMLElement> & { block?: false };
type BlockProps = HTMLAttributes<HTMLElement> & { block: true };
type Props = InlineProps | BlockProps;

export function Code(props: Props) {
    if (props.block) {
        const { block: _b, className, children, ...rest } = props;
        return (
            <pre className={[styles.code, className].filter(Boolean).join(' ')} {...rest}>
                <code>{children}</code>
            </pre>
        );
    }

    const { className, ...rest } = props;
    return <code className={[styles.code, className].filter(Boolean).join(' ')} {...rest} />;
}