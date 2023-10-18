let InitModule: nkruntime.InitModule = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
    initializer.registerMatch('lobby', {
      matchInit,
      matchJoinAttempt,
      matchJoin,
      matchLeave,
      matchLoop,
      matchSignal,
      matchTerminate,
    });
    initializer.registerMatchmakerMatched(matchmakerMatched);
    initializer.registerRpc("rpcCreateCustomMatch", rpcCreateCustomMatch);  
    initializer.registerRpc("rpcFindCustomMatch", rpcFindCustomMatch);
    initializer.registerRpc("rpcListMatches", rpcListMatches);
    initializer.registerRpc("rpcGetUserProperties", rpcGetUserProperties);
  }