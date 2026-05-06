// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawn } = require('child_process');

const child = spawn('npx', ['drizzle-kit', 'generate', '--name', 'pass1'], {
  env: { ...process.env, FORCE_COLOR: '0' },
  shell: true
});

child.stdout.on('data', data => {
  const str = data.toString();
  process.stdout.write(data);
  if (str.includes('❯')) {
    // We are at a prompt!
    // The prompt is:
    // ❯ + users.email_verified                       create column
    //   ~ users.emailVerified › users.email_verified rename column
    
    // Send Down Arrow then Enter to choose rename
    setTimeout(() => {
        console.log("Sending Down Arrow and Enter...");
        child.stdin.write('\x1B[B\r');
    }, 500);
  }
});

child.stderr.on('data', data => process.stderr.write(data));
child.on('close', code => console.log(`Exited ${code}`));
