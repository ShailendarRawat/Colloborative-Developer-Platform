export interface ConsoleLogEntry {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error' | 'system' | 'result';
  messages: string[];
  timestamp: number;
}

export interface ExecutionResult {
  logs: ConsoleLogEntry[];
  executionTimeMs: number;
  error?: string;
  returnedValue?: any;
}

/**
 * Strips basic TypeScript type annotations (types, interfaces, type-casting, simple annotations)
 * to allow direct in-browser execution of TS snippets without requiring a heavy compiler bundle.
 */
function stripTypeScript(code: string): string {
  let cleaned = code;
  // Remove interface declarations
  cleaned = cleaned.replace(/^\s*(export\s+)?interface\s+[A-Za-z0-9_]+(\s*<[^>]+>)?\s*\{[\s\S]*?\};?\s*$/gm, '');
  // Remove type declarations
  cleaned = cleaned.replace(/^\s*(export\s+)?type\s+[A-Za-z0-9_]+(\s*<[^>]+>)?\s*=[\s\S]*?;?\s*$/gm, '');
  // Remove parameter type annotations (e.g. : string, : number[])
  cleaned = cleaned.replace(/:\s*([A-Za-z0-9_<>\[\]|&\s]+)(?=[,)={])/g, '');
  // Remove return type annotations (e.g. ): string => or ): void {)
  cleaned = cleaned.replace(/\):\s*[A-Za-z0-9_<>\[\]|&\s]+(?=\s*(=>|\{))/g, ')');
  // Remove 'as SomeType'
  cleaned = cleaned.replace(/\s+as\s+[A-Za-z0-9_<>\[\]]+/g, '');
  return cleaned;
}

export async function runCodeSnippet(code: string, language: string): Promise<ExecutionResult> {
  const startTime = performance.now();
  const logs: ConsoleLogEntry[] = [];

  const formatArg = (arg: any): string => {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return Object.prototype.toString.call(arg);
      }
    }
    return String(arg);
  };

  const pushLog = (type: ConsoleLogEntry['type'], ...args: any[]) => {
    logs.push({
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      type,
      messages: args.map(formatArg),
      timestamp: Date.now(),
    });
  };

  if (language === 'typescript' || language === 'javascript') {
    const executableCode = language === 'typescript' ? stripTypeScript(code) : code;

    // Create a sandboxed console
    const customConsole = {
      log: (...args: any[]) => pushLog('log', ...args),
      info: (...args: any[]) => pushLog('info', ...args),
      warn: (...args: any[]) => pushLog('warn', ...args),
      error: (...args: any[]) => pushLog('error', ...args),
    };

    try {
      // Execute within an async function wrapper to support await at top-level
      const runFn = new Function('console', `
        return (async () => {
          ${executableCode}
        })();
      `);

      const result = await runFn(customConsole);

      if (result !== undefined) {
        pushLog('result', result);
      }

      const executionTimeMs = Math.round(performance.now() - startTime);
      return {
        logs,
        executionTimeMs,
        returnedValue: result,
      };
    } catch (err: any) {
      const executionTimeMs = Math.round(performance.now() - startTime);
      const errMsg = err?.stack || err?.message || String(err);
      pushLog('error', errMsg);
      return {
        logs,
        executionTimeMs,
        error: errMsg,
      };
    }
  } else if (language === 'python') {
    // Basic Python simulator / runner
    try {
      pushLog('system', '[Python Environment] Executing Python code...');
      // Extract print statements
      const lines = code.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        const match = trimmed.match(/^print\((.*)\)$/);
        if (match) {
          const content = match[1];
          // Simple string or expression eval
          if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
            pushLog('log', content.slice(1, -1));
          } else {
            try {
              // Try evaluating as JS math expression
              pushLog('log', String(Function(`return (${content});`)()));
            } catch {
              pushLog('log', content);
            }
          }
        }
      }
      const executionTimeMs = Math.round(performance.now() - startTime);
      return { logs, executionTimeMs };
    } catch (err: any) {
      const executionTimeMs = Math.round(performance.now() - startTime);
      pushLog('error', err.message || String(err));
      return { logs, executionTimeMs, error: err.message };
    }
  } else if (language === 'json') {
    try {
      const parsed = JSON.parse(code);
      pushLog('info', 'Valid JSON format:');
      pushLog('result', parsed);
      return { logs, executionTimeMs: Math.round(performance.now() - startTime) };
    } catch (err: any) {
      pushLog('error', 'Invalid JSON syntax: ' + err.message);
      return { logs, executionTimeMs: Math.round(performance.now() - startTime), error: err.message };
    }
  } else {
    pushLog('system', `Previewing ${language} document (${code.length} characters)`);
    return { logs, executionTimeMs: Math.round(performance.now() - startTime) };
  }
}
