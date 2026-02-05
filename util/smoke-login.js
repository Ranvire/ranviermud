#!/usr/bin/env node
'use strict';

const fs = require('fs');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const ranvierPath = path.join(repoRoot, 'ranvier');
const configPath = path.join(repoRoot, 'ranvier.json');

const READY_REGEXES = [
  /Telnet server started on port:\s*(\d+)/i,
  /Telnet server listening on port:\s*(\d+)/i,
  /Telnet listening on port:\s*(\d+)/i,
  /Listening for telnet connections on port:\s*(\d+)/i,
  /Telnet.*listening.*port:\s*(\d+)/i,
];

const LOGIN_PROMPT = /Welcome,\s+what is your name\?/i;
const NEXT_PROMPT = /(password|did i get that right|confirm your name|is that correct|account's username)/i;

function readPort() {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(raw);
    if (Number.isInteger(config.port)) {
      return config.port;
    }
  } catch (err) {
    console.warn(`Failed to read port from ${configPath}: ${err.message}`);
  }
  return 4000;
}

function stripTelnet(buffer) {
  const output = [];
  for (let i = 0; i < buffer.length; i += 1) {
    const byte = buffer[i];
    if (byte !== 0xff) {
      output.push(byte);
      continue;
    }

    const command = buffer[i + 1];
    if (command === undefined) {
      break;
    }

    if (command === 0xff) {
      output.push(0xff);
      i += 1;
      continue;
    }

    if (command === 0xfa) {
      let end = i + 2;
      while (end < buffer.length - 1) {
        if (buffer[end] === 0xff && buffer[end + 1] === 0xf0) {
          end += 1;
          break;
        }
        end += 1;
      }
      i = end;
      continue;
    }

    if (i + 2 < buffer.length) {
      i += 2;
    } else {
      break;
    }
  }
  return Buffer.from(output).toString('utf8');
}

function waitForPrompt(socket, matcher, timeoutMs, label) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${label}`));
    }, timeoutMs);

    function onData(chunk) {
      const normalized = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, 'utf8');
      buffer += stripTelnet(normalized);
      if (matcher.test(buffer)) {
        cleanup();
        resolve(buffer);
      }
    }

    function onError(err) {
      cleanup();
      reject(err);
    }

    function cleanup() {
      clearTimeout(timeout);
      socket.off('data', onData);
      socket.off('error', onError);
    }

    socket.on('data', onData);
    socket.on('error', onError);
  });
}

async function main() {
  const port = readPort();
  console.log(`Using telnet port: ${port}`);

  const child = spawn(process.execPath, [ranvierPath], {
    cwd: repoRoot,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let ready = false;
  const outputChunks = [];

  function handleOutput(chunk) {
    const text = chunk.toString('utf8');
    outputChunks.push(text);
    if (!ready) {
      for (const regex of READY_REGEXES) {
        const match = text.match(regex);
        if (match) {
          ready = true;
          console.log(`Detected telnet readiness: "${match[0]}"`);
          break;
        }
      }
    }
    process.stdout.write(text);
  }

  child.stdout.on('data', handleOutput);
  child.stderr.on('data', handleOutput);

  const readyTimeout = new Promise((_, reject) => {
    setTimeout(() => {
      if (!ready) {
        reject(new Error('Timed out waiting for telnet readiness output'));
      }
    }, 30000);
  });

  try {
    await Promise.race([
      readyTimeout,
      new Promise((resolve, reject) => {
        child.on('error', reject);
        const check = setInterval(() => {
          if (ready) {
            clearInterval(check);
            resolve();
          }
        }, 200);
      }),
    ]);

    console.log('Connecting to telnet...');
    const socket = net.createConnection({ port, host: '127.0.0.1' });

    await new Promise((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('error', reject);
    });
    console.log('Connected.');

    await waitForPrompt(socket, LOGIN_PROMPT, 20000, 'login prompt');
    console.log('Observed login prompt.');

    socket.write('smokeuser\r\n');

    await waitForPrompt(socket, NEXT_PROMPT, 20000, 'next prompt');
    console.log('Observed follow-up prompt.');

    socket.end();
  } catch (err) {
    console.error(err.message);
    throw err;
  } finally {
    console.log('Shutting down server...');
    child.kill('SIGINT');
    const exitCode = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        resolve(1);
      }, 10000);
      child.once('close', (code) => {
        clearTimeout(timeout);
        resolve(code);
      });
    });
    if (exitCode !== 0) {
      console.log(`Server exited with code ${exitCode}`);
    }
  }
}

main()
  .then(() => {
    console.log('Smoke login succeeded.');
    process.exit(0);
  })
  .catch(() => {
    console.error('Smoke login failed.');
    process.exit(1);
  });
