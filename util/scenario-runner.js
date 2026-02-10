#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function ensureTrailingSeparator(targetPath) {
  if (!targetPath) {
    return targetPath;
  }

  return /[\\/]$/.test(targetPath) ? targetPath : `${targetPath}${path.sep}`;
}

function printHelp() {
  console.log('Usage: node util/scenario-runner.js [--command-line "look"] [--commands-file <path>] [--room "area:roomId"] [--failOnUnknown]');
  console.log('       node util/scenario-runner.js [--command <name>] [--args "<args>"]');
  console.log('       --failOnUnknown        exit non-zero if any unknown commands are encountered');
  console.log('Boots the engine in no-transport mode, loads bundles, and executes one or more commands.');
  console.log('Command files are line-separated: one command per line, # for comments, blank lines ignored.');
}

function loadConfig(root) {
  const confPath = path.join(root, 'ranvier.conf.js');
  const jsonPath = path.join(root, 'ranvier.json');

  if (fs.existsSync(confPath)) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(confPath);
  }

  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }

  throw new Error('No ranvier.json or ranvier.conf.js found');
}

function parseCommandLine(line) {
  const trimmed = String(line || '').trim();
  if (!trimmed) {
    return null;
  }

  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) {
    return { raw: trimmed, name: trimmed, args: '' };
  }

  return {
    raw: trimmed,
    name: trimmed.slice(0, spaceIndex),
    args: trimmed.slice(spaceIndex + 1).trim(),
  };
}

function readCommandsFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  return content
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function collectCommandLines(args, root) {
  const commandLines = [];

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--command-line') {
      if (i + 1 >= args.length) {
        throw new Error('Missing value for --command-line');
      }

      commandLines.push(args[i + 1]);
      i += 1;
      continue;
    }

    if (arg === '--commands-file') {
      if (i + 1 >= args.length) {
        throw new Error('Missing value for --commands-file');
      }

      const commandFilePath = path.resolve(root, args[i + 1]);
      commandLines.push(...readCommandsFile(commandFilePath));
      i += 1;
      continue;
    }

    if (arg === '--room') {
      if (i + 1 >= args.length) {
        throw new Error('Missing value for --room');
      }

      i += 1;
      continue;
    }
  }

  if (!commandLines.length) {
    const commandIndex = args.indexOf('--command');
    const commandName = commandIndex >= 0 ? args[commandIndex + 1] : 'look';
    const argIndex = args.indexOf('--args');
    const commandArgs = argIndex >= 0 ? args[argIndex + 1] : '';
    commandLines.push(commandArgs ? `${commandName} ${commandArgs}` : commandName);
  }

  return commandLines;
}

function getRoomRef(args) {
  const roomIndex = args.indexOf('--room');
  if (roomIndex === -1) {
    return null;
  }

  if (roomIndex + 1 >= args.length) {
    throw new Error('Missing value for --room');
  }

  return args[roomIndex + 1];
}

async function bootEngine(root, config) {
  const Ranvier = require('ranvier');
  Ranvier.Data.setDataPath(ensureTrailingSeparator(path.join(root, 'data')));
  Ranvier.Config.load(config);

  const GameState = {
    AccountManager: new Ranvier.AccountManager(),
    AreaBehaviorManager: new Ranvier.BehaviorManager(),
    AreaFactory: new Ranvier.AreaFactory(),
    AreaManager: new Ranvier.AreaManager(),
    AttributeFactory: new Ranvier.AttributeFactory(),
    ChannelManager: new Ranvier.ChannelManager(),
    CommandManager: new Ranvier.CommandManager(),
    Config: Ranvier.Config,
    EffectFactory: new Ranvier.EffectFactory(),
    HelpManager: new Ranvier.HelpManager(),
    InputEventManager: new Ranvier.EventManager(),
    ItemBehaviorManager: new Ranvier.BehaviorManager(),
    ItemFactory: new Ranvier.ItemFactory(),
    ItemManager: new Ranvier.ItemManager(),
    MobBehaviorManager: new Ranvier.BehaviorManager(),
    MobFactory: new Ranvier.MobFactory(),
    MobManager: new Ranvier.MobManager(),
    PartyManager: new Ranvier.PartyManager(),
    PlayerManager: new Ranvier.PlayerManager(),
    QuestFactory: new Ranvier.QuestFactory(),
    QuestGoalManager: new Ranvier.QuestGoalManager(),
    QuestRewardManager: new Ranvier.QuestRewardManager(),
    RoomBehaviorManager: new Ranvier.BehaviorManager(),
    RoomFactory: new Ranvier.RoomFactory(),
    RoomManager: new Ranvier.RoomManager(),
    SkillManager: new Ranvier.SkillManager(),
    SpellManager: new Ranvier.SkillManager(),
    ServerEventManager: new Ranvier.EventManager(),
    GameServer: new Ranvier.GameServer(),
    DataLoader: Ranvier.Data,
    EntityLoaderRegistry: new Ranvier.EntityLoaderRegistry(),
    DataSourceRegistry: new Ranvier.DataSourceRegistry(),
  };

  GameState.DataSourceRegistry.load(require, root, config.dataSources);
  GameState.EntityLoaderRegistry.load(GameState.DataSourceRegistry, config.entityLoaders);
  GameState.AccountManager.setLoader(GameState.EntityLoaderRegistry.get('accounts'));
  GameState.PlayerManager.setLoader(GameState.EntityLoaderRegistry.get('players'));

  const bundleManager = new Ranvier.BundleManager(`${path.join(root, 'bundles')}/`, GameState);
  GameState.BundleManager = bundleManager;
  await bundleManager.loadBundles();

  return GameState;
}

function createFakePlayer(output) {
  const player = {
    name: 'ScenarioPlayer',
    commandQueue: [],
    socket: {
      writable: true,
      _prompted: false,
      write: (line) => output.push(String(line)),
    },
    send: (line) => output.push(String(line)),
    echo: (line) => output.push(String(line)),
    getBroadcastTargets() {
      return [this];
    },
  };

  return player;
}

function flushOutput(output) {
  if (output.length) {
    process.stdout.write(`${output.join('\n')}\n`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    printHelp();
    return;
  }

  const root = process.cwd();
  const commandLines = collectCommandLines(args, root);
  const parsedCommands = commandLines.map(parseCommandLine).filter(Boolean);
  const roomRef = getRoomRef(args);
  const failOnUnknown = args.includes('--failOnUnknown');

  if (!parsedCommands.length) {
    throw new Error('No commands were provided to execute');
  }

  const config = loadConfig(root);
  const GameState = await bootEngine(root, config);
  const output = [];
  const player = createFakePlayer(output);

  if (roomRef) {
    const room = GameState.RoomManager.getRoom(roomRef);
    if (!room) {
      console.error(`[error] room not found: ${roomRef}`);
      process.exit(1);
      return;
    }

    player.room = room;
    if (typeof room.addPlayer === 'function') {
      room.addPlayer(player);
    }
  }

  console.log(`[info] scenario starting (commands=${parsedCommands.length})`);
  let unknownCount = 0;

  for (let i = 0; i < parsedCommands.length; i += 1) {
    const commandSpec = parsedCommands[i];
    const commandMatch = GameState.CommandManager.find(commandSpec.name, true);

    if (!commandMatch) {
      unknownCount += 1;
      player.send('Unknown command.');
      continue;
    }

    const { command, alias } = commandMatch;
    console.log(`[run] ${i + 1}/${parsedCommands.length}: ${commandSpec.raw}`);
    await command.execute(commandSpec.args, player, alias);
  }

  flushOutput(output);

  const failed = failOnUnknown && unknownCount > 0 ? 1 : 0;
  console.log(`[info] scenario complete (commands=${parsedCommands.length}, unknown=${unknownCount}, failed=${failed})`);
  process.exit(failed);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
