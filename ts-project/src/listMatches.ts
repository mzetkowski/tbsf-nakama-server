/**
 * Lists available matches on the Nakama server based on provided criteria.
 *
 * Expects a payload with parameters to filter the match list, in the following format:
 * {
 *   "limit": number,          // The maximum number of matches to return.
 *   "authoritative": boolean, // Whether to list only authoritative (server-managed) matches.
 *   "label": string,          // A label to filter matches by.
 *   "minSize": number,        // The minimum number of participants in a match.
 *   "maxSize": number         // The maximum number of participants in a match.
 * }
 *
 * Returns a list of matches that meet the given criteria, excluding private matches.
 */
function rpcListMatches(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const parsedPayload = JSON.parse(payload);
    const { limit, authoritative, label, minSize, maxSize } = parsedPayload;

    const allMatches = nk.matchList(limit, authoritative, label, minSize, maxSize);

    const publicMatches = allMatches.filter(function (match) {
        const labelData = JSON.parse(match.label);
        return !labelData.isPrivate;
    });

    return JSON.stringify(publicMatches);
}
