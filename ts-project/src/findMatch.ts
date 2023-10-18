/**
 * Finds a custom match in the Nakama server based on a room name.
 *
 * Expects a payload in the following format:
 * {
 *   "roomName": string   // The name of the room to search for.
 * }
 *
 * Returns the match ID if found, otherwise returns an error message.
 */
function rpcFindCustomMatch(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  enum ErrorCodes {
    InvalidInput = 0,
    RoomNotFound = 1,
    InternalServerError = 2
  };

  try {
    const parsedPayload = JSON.parse(payload);
    const { roomName } = parsedPayload;

    if (!roomName || typeof roomName !== 'string') {
      return JSON.stringify({ "error": "Invalid room name", "code": ErrorCodes.InvalidInput });
    }

    const readResult = nk.storageRead([{ collection: CollectionRoomNameToMatchId, key: roomName, userId: UidSystem }]);
    const matchId = readResult[0]?.value?.matchId;

    if (!matchId) {
      return JSON.stringify({ "error": "Room not found", "code": ErrorCodes.RoomNotFound });
    }

    return JSON.stringify({ "matchId": matchId });
  } catch (e) {
    logger.error(`Failed to find custom match: ${e}`);
    return JSON.stringify({ "error": "Internal Server Error", "code": ErrorCodes.InternalServerError });
  }
}
