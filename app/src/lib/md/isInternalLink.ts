export function isInternalContentLink(href: string): boolean {
    if (
        href.startsWith('#') ||
        href.startsWith('/') ||
        href.endsWith('.md') ||
        href.includes('.md#')
    ) return true
    return false
}

