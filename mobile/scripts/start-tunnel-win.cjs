const { spawn } = require('child_process');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const expoCli = path.join(projectRoot, 'node_modules', 'expo', 'bin', 'cli');
const maxAttempts = 2;
const transientTunnelErrors = ['remote gone away', 'session closed'];

function createChildEnv() {
  return {
    ...process.env,
    ANDROID_HOME: 'C:\\__expo_skip_adb__',
    ANDROID_SDK_ROOT: '',
  };
}

function shouldRetry(output) {
  const normalizedOutput = output.toLowerCase();
  return transientTunnelErrors.some((text) => normalizedOutput.includes(text));
}

function runExpoTunnel() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [expoCli, 'start', '--tunnel', '--go'], {
      cwd: projectRoot,
      env: createChildEnv(),
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let combinedOutput = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      process.stdout.write(chunk);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      process.stderr.write(chunk);
    });

    child.on('error', (error) => {
      resolve({ code: 1, signal: null, output: `${combinedOutput}\n${error.message}` });
    });

    child.on('exit', (code, signal) => {
      resolve({ code: code ?? 1, signal, output: combinedOutput });
    });
  });
}

(async () => {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await runExpoTunnel();

    if (result.signal) {
      process.kill(process.pid, result.signal);
      return;
    }

    if (result.code === 0) {
      process.exit(0);
    }

    const canRetry = attempt < maxAttempts && shouldRetry(result.output);
    if (canRetry) {
      console.error('\nTunnel startup hit a transient ngrok error. Retrying once...\n');
      continue;
    }

    process.exit(result.code);
  }
})();