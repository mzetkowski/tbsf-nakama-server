/**
 * Creates a custom match in Nakama server.
 *
 * Expects a payload in the following format:
 * {
 *   "roomName": string,       // The name of the room to create
 *   "maxPlayers": number,     // Maximum number of players allowed in the room
 *   "isPrivate": boolean      // Whether the room is private.
 * }
 * Returns the created match ID or error message in case of failure.
 */
function rpcCreateCustomMatch(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  enum ErrorCodes {
    InvalidInput = 0,
    RoomExists = 1,
    MatchCreationFailed = 2,
    InternalServerError = 3
  };

  try {
    const parsedPayload = JSON.parse(payload);
    const { roomName, maxPlayers, isPrivate } = parsedPayload;

    if (!roomName || typeof roomName !== 'string') {
      return JSON.stringify({ "error": "Invalid room name", "code": ErrorCodes.InvalidInput });
    }

    const existingRoom = nk.storageRead([{ collection: CollectionRoomNameToMatchId, key: roomName, userId: UidSystem }]);
    if (existingRoom.length > 0) {
      return JSON.stringify({ "error": "Room already exists", "code": ErrorCodes.RoomExists });
    }

    const matchId = nk.matchCreate("lobby", { "roomName": roomName, "maxPlayers": maxPlayers, "isPrivate": isPrivate, "host": ctx.userId });
    if (!matchId) {
      return JSON.stringify({ "error": "Match creation failed", "code": ErrorCodes.MatchCreationFailed });
    }

    nk.storageWrite([
      {
        collection: CollectionRoomNameToMatchId,
        key: roomName,
        value: { "matchId": matchId },
        userId: UidSystem,
        permissionRead: 2
      },
      {
        collection: CollectionMatchIdToRoomName,
        key: matchId,
        value: { "roomName": roomName },
        userId: UidSystem,
        permissionRead: 2
      }
    ]);

    return JSON.stringify({ "matchId": matchId });
  } catch (e) {
    logger.error(`Failed to create custom match: ${e}`);
    return JSON.stringify({ "error": "Internal Server Error", "code": ErrorCodes.InternalServerError });
  }
}
