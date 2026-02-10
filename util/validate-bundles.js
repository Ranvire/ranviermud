#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function loadConfig(root, findings) {
  const confPath = path.join(root, 'ranvier.conf.js');
  const jsonPath = path.join(root, 'ranvier.json');

  if (fs.existsSync(confPath)) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(confPath);
  }

  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }

  findings.push({
    level: 'error',
    code: 'CONFIG_NOT_FOUND',
    message: 'No ranvier.json or ranvier.conf.js found',
    path: root,
  });

  return null;
}

function hasYamlFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries.some((entry) => entry.isFile() && entry.name.endsWith('.yml'));
}

function formatFinding(finding) {
  const context = [];
  if (finding.bundle) {
    context.push(`bundle=${finding.bundle}`);
  }
  if (finding.area) {
    context.push(`area=${finding.area}`);
  }
  if (finding.path) {
    context.push(`path=${finding.path}`);
  }

  const contextText = context.length ? ` (${context.join(', ')})` : '';
  return `[${finding.level.toUpperCase()}] ${finding.code}: ${finding.message}${contextText}`;
}

function validateFilesystem(root, config, findings) {
  const bundles = Array.isArray(config.bundles) ? config.bundles : [];

  for (const bundle of bundles) {
    const bundlePath = path.join(root, 'bundles', bundle);
    const relBundlePath = path.join('bundles', bundle);

    if (!fs.existsSync(bundlePath) || !fs.statSync(bundlePath).isDirectory()) {
      findings.push({
        level: 'error',
        code: 'BUNDLE_DIR_MISSING',
        message: 'Missing bundle directory',
        bundle,
        path: relBundlePath,
      });
      continue;
    }

    const areasPath = path.join(bundlePath, 'areas');
    if (fs.existsSync(areasPath) && fs.statSync(areasPath).isDirectory()) {
      const areaDirs = fs.readdirSync(areasPath, { withFileTypes: true }).filter((entry) => entry.isDirectory());
      for (const areaDir of areaDirs) {
        const manifestPath = path.join(areasPath, areaDir.name, 'manifest.yml');
        if (!fs.existsSync(manifestPath)) {
          findings.push({
            level: 'warn',
            code: 'AREA_MANIFEST_MISSING',
            message: 'Area manifest.yml is missing',
            bundle,
            area: areaDir.name,
            path: path.join(relBundlePath, 'areas', areaDir.name, 'manifest.yml'),
          });
        }
      }
    }

    const helpPath = path.join(bundlePath, 'help');
    if (fs.existsSync(helpPath) && fs.statSync(helpPath).isDirectory() && !hasYamlFiles(helpPath)) {
      findings.push({
        level: 'warn',
        code: 'HELP_YAML_MISSING',
        message: 'Help directory contains no .yml files',
        bundle,
        path: path.join(relBundlePath, 'help'),
      });
    }
  }
}

async function validateEngineLoad(root, config, findings) {
  try {
    const Ranvier = require('ranvier');
    Ranvier.Data.setDataPath(path.join(root, 'data'));
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
  } catch (error) {
    findings.push({
      level: 'error',
      code: 'ENGINE_LOAD_FAILED',
      message: 'Bundle load failed in --engine mode',
      detail: {
        message: error.message,
        stack: error.stack,
      },
    });

    return null;
  }
}



async function validatePlayers(GameState, findings, strictMode) {
  try {
    const playersLoader = GameState.EntityLoaderRegistry.get('players');
    if (!playersLoader) {
      findings.push({
        level: strictMode ? 'error' : 'warn',
        code: 'PLAYERS_LOADER_MISSING',
        message: 'No players entity loader configured',
      });
      return;
    }

    const playerRecords = await playersLoader.fetchAll();
    for (const [playerName, playerRecord] of Object.entries(playerRecords || {})) {
      const attributes = playerRecord && playerRecord.attributes;
      if (!attributes || typeof attributes !== 'object') {
        continue;
      }

      for (const attributeKey of Object.keys(attributes)) {
        if (!GameState.AttributeFactory.has(attributeKey)) {
          findings.push({
            level: strictMode ? 'error' : 'warn',
            code: 'UNKNOWN_PLAYER_ATTRIBUTE',
            message: `Player has unknown attribute '${attributeKey}'`,
            path: `data/player/${playerName}.json`,
            detail: { player: playerName, attribute: attributeKey },
          });
        }
      }
    }
  } catch (error) {
    findings.push({
      level: 'error',
      code: 'PLAYER_VALIDATION_FAILED',
      message: 'Failed while validating player attributes',
      detail: {
        message: error.message,
        stack: error.stack,
      },
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const jsonOnly = args.includes('--json');
  const strictMode = args.includes('--strict');
  const playersMode = args.includes('--players');
  const engineMode = args.includes('--engine') || playersMode;
  const root = process.cwd();
  const findings = [];
  const config = loadConfig(root, findings);

  if (config) {
    validateFilesystem(root, config, findings);

    if (engineMode && !findings.some((finding) => finding.level === 'error')) {
      const gameState = await validateEngineLoad(root, config, findings);
      if (gameState && playersMode) {
        await validatePlayers(gameState, findings, strictMode);
      }
    }
  }

  if (jsonOnly) {
    process.stdout.write(`${JSON.stringify(findings, null, 2)}\n`);
  } else {
    findings.forEach((finding) => {
      const line = formatFinding(finding);
      if (finding.level === 'error') {
        console.error(line);
      } else {
        console.warn(line);
      }
    });
  }

  const hasErrors = findings.some((finding) => finding.level === 'error');
  process.exit(hasErrors ? 1 : 0);
}

main();
