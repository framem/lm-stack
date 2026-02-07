export function toMovieSlug(title: string, id: string): string {
    const nameSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    return `${nameSlug}-${id}`
}

export function extractIdFromSlug(slug: string): string {
    // cuid IDs are 25 alphanumeric chars — always the last segment after the final hyphen
    const lastHyphen = slug.lastIndexOf('-')
    return lastHyphen !== -1 ? slug.slice(lastHyphen + 1) : slug
}
