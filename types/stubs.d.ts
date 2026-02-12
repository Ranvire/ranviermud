declare var __dirname: string;
declare var process: any;
declare var Buffer: any;
declare var require: {
  (id: string): any;
  main?: any;
  cache?: Record<string, any>;
  resolve(id: string): string;
};
declare var module: any;
declare var console: any;
declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): any;
declare function clearTimeout(timeoutId: any): void;
declare function setInterval(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): any;
declare function clearInterval(intervalId: any): void;

declare function describe(name: string, fn: (...args: any[]) => void): void;
declare function it(name: string, fn: (...args: any[]) => void): void;
declare function before(fn: (...args: any[]) => void): void;
declare function after(fn: (...args: any[]) => void): void;
declare function beforeEach(fn: (...args: any[]) => void): void;
declare function afterEach(fn: (...args: any[]) => void): void;

declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
}

declare module 'fs';
declare module 'os';
declare module 'path';
declare module 'net';
declare module 'assert';
declare module 'child_process';
declare module 'node:test';
declare module 'node:assert/strict';
declare module 'readline';
