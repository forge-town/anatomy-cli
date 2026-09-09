export const posixLauncher = '#!/bin/sh\nexec node "$(dirname "$0")/../anatomy.mjs" "$@"\n';
