/**
 * Retrieves user properties for a specific match and user from the Nakama server.
 *
 * Expects a payload in the following format:
 * {
 *   "matchId": string,   // The ID of the match.
 *   "userId": string     // The ID of the user whose properties are being retrieved.
 * }
 *
 * Returns the properties of the specified user in the specified match.
 */
function rpcGetUserProperties(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const parsedPayload = JSON.parse(payload);
    const { matchId, userId } = parsedPayload;

    const matchUserProperties = nk.storageRead([{ collection: CollectionMatchUserProperties, key: matchId, userId: UidSystem }]);
    const userProperties = matchUserProperties[0].value;

    return JSON.stringify(userProperties[userId]);
  };
