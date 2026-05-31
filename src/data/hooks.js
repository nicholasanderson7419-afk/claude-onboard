export function sessionStartHook(os) {
  const command = os === 'windows'
    ? `powershell -NoProfile -Command "Write-Output ('Today: ' + (Get-Date -Format yyyy-MM-dd)); git rev-parse --abbrev-ref HEAD 2>$null"`
    : `sh -c 'echo "Today: $(date +%Y-%m-%d)"; git rev-parse --abbrev-ref HEAD 2>/dev/null'`;
  return { SessionStart: [{ hooks: [{ type: 'command', command }] }] };
}
