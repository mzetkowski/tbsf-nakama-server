/**
 * Enum for Operation Codes (OpCodes) used to identify different types of messages and actions
 * in the game. Each OpCode corresponds to a specific action or event, such as a player's turn ending,
 * a player using an ability, or changes in player readiness or number.
 */
enum OpCode {
  TurnEnded = 0,
  AbilityUsed = 1,
  PlayerNumberChanged = 2,
  PlayerReadyChanged = 3,
}

const matchInit = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: { [key: string]: string }): { state: nkruntime.MatchState, tickRate: number, label: string } {
  const seed = Math.floor((Math.random() - 0.5) * Math.pow(2, 32));
  const { roomName, maxPlayers, isPrivate, host } = params;

  const writeObject: nkruntime.StorageWriteRequest = {
    collection: CollectionMatchUserProperties,
    key: ctx.matchId,
    userId: UidSystem,
    value: {},
    permissionRead: 1,
    permissionWrite: 0,
  };
  nk.storageWrite([writeObject]);

  return {
    state: { presences: {}, emptyTicks: 0, roomName: roomName },
    tickRate: 1,
    label: JSON.stringify({ roomName, maxPlayers, isPrivate, seed, host }),
  };
};

const matchJoin = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): { state: nkruntime.MatchState } | null {
  const storageObjects = nk.storageRead([{ collection: CollectionMatchUserProperties, key: ctx.matchId, userId: UidSystem }]);
  const matchProperties = storageObjects[0].value || {};

  presences.forEach(function (p) {
    state.presences[p.sessionId] = p;
    matchProperties[p.userId] = { isReady: false };
  });

  const writeObject: nkruntime.StorageWriteRequest = {
    collection: CollectionMatchUserProperties,
    key: ctx.matchId,
    userId: UidSystem,
    value: matchProperties,
    permissionRead: 1,
    permissionWrite: 0,
  };

  nk.storageWrite([writeObject]);
  return {
    state
  };
}

const matchJoinAttempt = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presence: nkruntime.Presence, metadata: { [key: string]: any }): { state: nkruntime.MatchState, accept: boolean, rejectMessage?: string | undefined } | null {
  logger.debug('%q attempted to join Lobby match', ctx.userId);
  const { maxPlayers } = JSON.parse(ctx.matchLabel);
  const currentPlayers = Object.keys(state.presences).length;

  if (currentPlayers >= maxPlayers) {
    return {
      state,
      accept: false,
      rejectMessage: 'The room is full'
    };
  }
  return {
    state,
    accept: true
  };
}

const matchLeave = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): { state: nkruntime.MatchState } | null {
  const matchLabel = JSON.parse(ctx.matchLabel);
  const hostId = matchLabel.host;
  const isHostLeaving = presences.some(p => p.userId === hostId);
  
  presences.forEach(p => delete state.presences[p.sessionId]);

  // The match terminates if the host is leaving the game
  if (isHostLeaving) {
    clearMatchData(nk, state.roomName, ctx.matchId);
    return null;
  }

  return { state };
};


const matchLoop = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, messages: nkruntime.MatchMessage[]): { state: nkruntime.MatchState } | null {
  if (Object.keys(state.presences).length === 0) {
    state.emptyTicks++;
  }

  if (state.emptyTicks > 100) {
    clearMatchData(nk, state.roomName, ctx.matchId);
    return null;
  }

  messages.forEach(function (message) {
    let actionHandler = getActionHandler(message.opCode);
    actionHandler(ctx, message, logger, nk, dispatcher, tick, state);
  });

  return {
    state
  };
}

const matchSignal = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, data: string): { state: nkruntime.MatchState, data?: string } | null {
  logger.debug('Lobby match signal received: ' + data);

  return {
    state,
    data: "Lobby match signal received: " + data
  };
}

const matchTerminate = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, graceSeconds: number): { state: nkruntime.MatchState } | null {
  logger.debug('Lobby match terminated');

  return {
    state
  };
}

const matchmakerMatched = function(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, matches: nkruntime.MatchmakerResult[]): string {
  matches.forEach(function (match) {
    logger.info("Matched user '%s' named '%s'", match.presence.userId, match.presence.username);
    Object.keys(match.properties).forEach(function (key) {
      logger.info("Matched on '%s' value '%v'", key, match.properties[key]);
    });
  });

  const maxPlayers = matches[0].properties["maxPlayers"];
  const host = matches[0].presence.userId;
  try {
    const matchId = nk.matchCreate("lobby", { host, maxPlayers, isPrivate: true, roomName: "quickmatch" });
    return matchId;
  } catch (err: any) {
    logger.error("matchmaking error");
    throw (err);
  }
}

/**
 * Updates player's ready status.
 */
const handlePlayerReadyChanged = function(ctx: nkruntime.Context, message: nkruntime.MatchMessage, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState) {
  dispatcher.broadcastMessage(message.opCode, message.data, Object.keys(state.presences).map(k => state.presences[k]).filter((p: nkruntime.Presence) => p.sessionId !== message.sender.sessionId), message.sender, true);

  let actionParams = JSON.parse(nk.binaryToString(message.data));

  const storageObjects = nk.storageRead([{ collection: CollectionMatchUserProperties, key: ctx.matchId, userId: UidSystem }]);
  const matchProperties = storageObjects[0].value || {};

  matchProperties[message.sender.userId].isReady = actionParams["is_ready"];

  const writeObject: nkruntime.StorageWriteRequest = {
    collection: CollectionMatchUserProperties,
    key: ctx.matchId,
    userId: UidSystem,
    value: matchProperties,
    permissionRead: 1,
    permissionWrite: 0,
  };
  nk.storageWrite([writeObject]);
}

/**
 * Updates player's number.
 */
const handlePlayerNumberChanged = function(ctx: nkruntime.Context, message: nkruntime.MatchMessage, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState) {
  dispatcher.broadcastMessage(message.opCode, message.data, Object.keys(state.presences).map(k => state.presences[k]).filter((p: nkruntime.Presence) => p.sessionId !== message.sender.sessionId), message.sender, true);

  let actionParams = JSON.parse(nk.binaryToString(message.data));

  const storageObjects = nk.storageRead([{ collection: CollectionMatchUserProperties, key: ctx.matchId, userId: UidSystem }]);
  const matchProperties = storageObjects[0].value || {};

  matchProperties[message.sender.userId].playerNumber = actionParams["player_number"];

  const writeObject: nkruntime.StorageWriteRequest = {
    collection: CollectionMatchUserProperties,
    key: ctx.matchId,
    userId: UidSystem,
    value: matchProperties,
    permissionRead: 1,
    permissionWrite: 0,
  };
  nk.storageWrite([writeObject]);
}

/**
 * Clears all data related to a specific match from the Nakama storage.
 * 
 * This function is used to clean up storage entries once a match is concluded or terminated. 
 * It removes entries for the match from various collections including room names, 
 * user properties, and other match-related data.
 */
const clearMatchData = function(nk: nkruntime.Nakama, roomName: string, matchId: string) {
  nk.storageDelete([
    {
      collection: CollectionRoomNameToMatchId,
      key: roomName,
      userId: UidSystem
    },
    {
      collection: CollectionMatchIdToRoomName,
      key: matchId,
      userId: UidSystem
    },
    {
      collection: CollectionMatchUserProperties,
      key: matchId,
      userId: UidSystem
    }
  ]);
}

/**
 * Broadcasts the received message to all connected players except the sender.
 * This function is used as a default action to pass along game messages without additional processing.
 */
const passMessage = function(ctx: nkruntime.Context, message: nkruntime.MatchMessage, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState) {
  dispatcher.broadcastMessage(message.opCode, message.data, Object.keys(state.presences).map(k => state.presences[k]).filter((p: nkruntime.Presence) => p.sessionId !== message.sender.sessionId), message.sender, true);
};

/**
 * Retrieves the specific action handler based on the opcode.
 * If no specific handler is found for the given opcode, the default passMessage handler is returned.
 */
const getActionHandler = function(key: number): (ctx: nkruntime.Context, message: nkruntime.MatchMessage, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState) => void {
  return ActionHandlers[key] || passMessage;
};

/**
 * A mapping of opcodes to their corresponding action handlers.
 * This object directs incoming messages to the appropriate function based on their operation code.
 */
const ActionHandlers: { [key: number]: (ctx: nkruntime.Context, message: nkruntime.MatchMessage, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState) => void; } = {
  [OpCode.TurnEnded]: passMessage,
  [OpCode.AbilityUsed]: passMessage,
  [OpCode.PlayerNumberChanged]: handlePlayerNumberChanged,
  [OpCode.PlayerReadyChanged]: handlePlayerReadyChanged,
};
