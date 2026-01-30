export type AuthorDto = {
    id?: number;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null; // jakby backend kiedyś zwracał "name"
};

export function formatAuthors(authors?: AuthorDto[] | null): string {
    if (!authors?.length) return "—";

    const parts = authors
        .map((a) => {
            const full =
                `${(a.firstName ?? "").trim()} ${(a.lastName ?? "").trim()}`.trim();
            return full || (a.name ?? "").trim();
        })
        .filter((s) => s);

    return parts.length ? parts.join(", ") : "—";
}
