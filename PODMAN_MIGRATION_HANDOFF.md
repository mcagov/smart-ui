# Handoff: Docker Desktop → Podman migration

Working notes for a future Claude Code session, not permanent project docs. **To resume the API work:** open a session in `smart-api` and point Claude at this file (`../smart-ui/PODMAN_MIGRATION_HANDOFF.md`). Memory saved in the smart-ui session doesn't carry over to other repos.

## Why

Docker Desktop needs a paid licence for enterprise use. Docker Engine, the `docker` CLI and Docker Compose are Apache-2.0 and free. So the goal is that **developer laptops use Podman instead of Docker Desktop**.

**CI doesn't change.** Jenkins and GitHub Actions run Docker Engine on Linux, which is already compliant. The one open assumption is that the Jenkins agents install `docker-ce`/`docker.io`, not "Docker Desktop for Linux". That's very unlikely to be wrong, but hasn't been confirmed with infra. Don't move CI to Podman: it isn't needed, and things like `docker network inspect bridge` in the Jenkinsfiles would break.

## smart-ui: done

Branch `docker-to-podman`, PR open and awaiting approval (as of 2026-10-02). Verified end to end on an Apple Silicon Mac with Podman 6.1.3:
- `default` profile with `npm start`
- `default` profile alongside smart-api's compose and the API running through Gradle
- `full` profile
- unit, BDD and WDIO tests all passing
- nginx routing to the UI and to localstack

What changed and why:

| File | Change | Why |
|---|---|---|
| `README.md` | Podman setup section, Rosetta step, `npm run ecr:login`, `podman compose up`, `direnv allow`, `ExpiredToken` troubleshooting, a note that the API runs through Gradle, a tip for hiding the compose banner | Replaces "install Docker" |
| `scripts/podman-ecr-login.js` and `package.json` (`ecr:login`) | ECR login script, modelled on `ca:setup` | Wraps the `--compat-auth-file` gotcha below |
| `docker-compose.yaml` | `NGINX_ENTRYPOINT_LOCAL_RESOLVERS: 1` on `nginx` and `external`; `extra_hosts: host.docker.internal:host-gateway` on `nginx` | Resolver fix and localstack routing (below) |
| `test/nginx/smart.conf` | `resolver ${NGINX_LOCAL_RESOLVERS}`; localstack `proxy_pass http://host.docker.internal:4566` (was `172.17.0.1`); fixed `smart-commets-api` typo | Docker-only addresses |
| `test/nginx/smart-ui-external.conf` | Resolver placeholder; removed the `172.17.0.1` backup upstream | The backup made nginx hang for 60 seconds under Podman when `npm start` was down |
| `test/nginx/nginx.conf` | Removed the unused `http`-level `resolver 127.0.0.11` | Not a template, so a placeholder there isn't filled in; every server block sets its own resolver |
| `test/README.md` | certbot steps changed to `podman`; replaced the broken "exec into the stopped container" step with copying out through an alpine container (`cp -L` from `live/`); removed the stale step 11 | |
| `.gitignore` | `new-certs/` | Output of the certbot steps above, which includes a private key |
| Deleted `terraform/update-local-certs.sh` and `Dockerfile1` | Both dead: the script targeted the removed `test/nginx/ssl/`, and `Dockerfile1` was unused (Node 16, and it couldn't build) | |

## Gotchas found (these will apply to smart-api too)

1. **Use `docker-compose` as the compose provider, not Python `podman-compose`.** Run `brew install podman docker-compose`, then `podman compose ...` hands off to `/opt/homebrew/bin/docker-compose`. `podman-compose` handles `depends_on: condition:` and `deploy.resources` only partially.
2. **ECR auth:** `docker-compose` only reads `~/.docker/config.json`, so a plain `podman login` leads to `unauthorized: authentication required`. Use `podman login --compat-auth-file ~/.docker/config.json ...` (Podman 5 or later). Also remove any leftover `"credsStore": "desktop"` from that file.
3. **Rosetta is off by default in Podman 6.x.** The ECR images are amd64 only, so on Apple Silicon they run under QEMU and Redis segfaults (`qemu: uncaught target signal 11`). The UI then reports `Redis Client Error read ECONNRESET`. Fix: put `[machine]` / `rosetta = true` in `~/.config/containers/containers.conf`, then `podman machine rm` and `init` to recreate the machine. Check with `podman machine inspect --format '{{.Rosetta}}'` (should print `true`) and look for a `rosetta` entry in `podman machine ssh ls /proc/sys/fs/binfmt_misc/`. When Rosetta is off, `rosetta-activation.service` logs a mount error but still reports SUCCESS.
4. **Recommended machine:** `podman machine init --rootful --cpus 4 --memory 8192`. `--rootful` was a precaution for nginx's ports 80/443 and `cert-gen`'s `chown`. Whether it's strictly needed was never tested.
5. **`resolver 127.0.0.11` is Docker's built-in DNS server and doesn't exist under Podman.** Podman's DNS is the network gateway (it came out as `10.89.0.1`). In nginx templates, use `NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1` plus `${NGINX_LOCAL_RESOLVERS}`; this still gives `127.0.0.11` on Docker, so CI is unaffected.
6. **`172.17.0.1` (Docker's default bridge gateway) doesn't route under Podman.** Use `extra_hosts: host.docker.internal:host-gateway` with a fixed hostname in `proxy_pass`. Fixed names are looked up at start-up from `/etc/hosts`; variable `proxy_pass` targets go through the DNS resolver, which doesn't read `/etc/hosts`. Under Podman, `host.docker.internal` came out as `192.168.127.254`, the address Podman's port forwarder (gvproxy) uses for the Mac.
7. **`ECONNRESET` vs `ECONNREFUSED`:** Podman's port forwarder accepts connections on a published port even when the container behind it has died, then resets them. So `ECONNRESET` means a container crashed, and `ECONNREFUSED` means nothing publishes that port at all.
8. **AWS `ExpiredToken` after a successful `aws sso login`:** old `AWS_ACCESS_KEY_ID`/`SECRET`/`SESSION_TOKEN` variables in the shell override the SSO profile. `aws configure list` shows `env` in the `TYPE` column when this happens. In smart-ui this is now prevented by `mise.toml`'s `[env]`, which unsets all three (`VAR = false`) and sets `AWS_PROFILE` whenever you're in the repo (see "Follow-up: direnv → mise" below). Without that, `unset` them by hand.

## Follow-up: direnv → mise (smart-ui, branch `make-file-startup`, 2026-10-23)

After the Podman work, smart-ui's local setup moved onto mise to cut the number of onboarding steps. direnv is no longer used in smart-ui, so the `direnv allow` README step in the table above is out of date.

- **`mise.toml`:**
  - removed `direnv` from `[tools]`
  - added `[env]`, which sets `AWS_PROFILE=smart-dev-support` and unsets the three AWS credential variables. It also sets `PODMAN_COMPOSE_WARNING_LOGS=false`, which hides the `>>>> Executing external compose provider` banner inside this repo. The env var is documented in `man podman-compose`, and is the per-project alternative to `compose_warning_logs` in `containers.conf`.
  - added `[tasks]`: `aws-login`, `deps`, `services`, `down` and `clean` (`dev` is a file task, below)
- **`mise run clean`** runs `podman compose down --volumes --remove-orphans` with `COMPOSE_PROFILES` set to every profile from `podman compose config --profiles`:
  - **Every profile:** a plain `down` only acts on active profiles, so it would miss containers from a profile used once, such as `full` for WDIO.
  - **Only this project:** it removes the smart-ui compose project's containers and volumes and nothing else. `podman system prune` was ruled out because it would also wipe other projects' containers (beacons, droits).
  - **DB data is lost:** the DB volumes go, so the databases reset to the seed data built into the images.
  - **Kept:** pulled images (to avoid slow re-pulls) and `.certs/` (`cert-gen` rewrites it).
  - **Verified by the user on 2026-10-23:** it removed all 10 containers and the network.
  - The `podman compose` banner goes to stderr, so it doesn't end up in the profile list (`podman compose config --profiles 2>/dev/null` prints only the five profile names).
- **`mise run down` only stops containers** (`podman compose stop`, across every profile); it doesn't remove them, as the user asked. `up` reuses the stopped containers, so DB data survives a `down`/`dev` cycle. `clean` is the only task that removes anything.
  - The test-db containers create no volumes: after the old `down`-based flow, `podman volume ls` showed only `droits_pgdata`, and `clean` removed no volumes. So the DB data lives in each container's writable layer and goes when the container is removed. `--volumes` on `clean` is kept in case a named volume is added later.
  - An earlier guess in this session was that the old `down` left anonymous Postgres volumes behind. The evidence above showed that was wrong.
- **`deps` skip fix:** `npm install` rewrites `package-lock.json` on every run, even with no changes. That left the lockfile as new as `node_modules/.package-lock.json`, so mise never saw `deps` as up to date. The task now ends with `touch node_modules/.package-lock.json`. Untested at the time of writing.
- **`docker-compose.yaml`:** `smart-attachments-api`'s `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_SESSION_TOKEN` now default to `test`. This silences the "variable is not set" warnings caused by mise's unset; localstack accepts any credentials.
- **`dev` is a mise file task at `.mise/tasks/dev`** (a bash script, executable), not inline TOML. It starts with a numbered menu: an aligned three-column `cat` heredoc plus a `read -p` loop. Bash `select` was replaced because it reprinted the whole menu on every empty answer. `#MISE quiet=true` hides mise's `[dev] $ <path>` line. The options:
  - `1` Local UI dev = `default,api`
  - `2` Local API dev = `default,attachments,comments` (smart-api runs from its repo through Gradle; the task warns if `localhost:8080/livez` isn't answering)
  - `3` All containers = `full` (UI in the `smart-ui` container, plain `node`, no hot reload, as the user expects)
  - **No remembered default, by the user's choice.** Enter or anything other than 1, 2 or 3 re-prompts with `Please choose 1, 2 or 3:` without redrawing the menu. `mise run dev ui|api|full` skips the menu.
  - The choice is exported as `COMPOSE_PROFILES`, which overrides `.env`.
  - Before starting, it stops services that aren't in the chosen profiles, worked out with `comm` over `podman compose config --services` per profile set. For example, the `smart-api` container would otherwise hold port 8080 when switching to option 2.
  - In option 3 it runs `deps`, then `npx gulp default`, then `services` in sequence, because the container serves the host's built `public/`. It then follows `podman compose logs -f smart-ui` instead of running `npm start`.
  - A background `curl` loop prints `SMarT UI is ready: http://localhost:2997` and `smart-api health: http://localhost:8080/livez` once the UI port answers. In Alacritty under tmux with `mouse on`, Shift+click opens the links (confirmed by the user). DB connection details were discussed but not added.
  - **API readiness:** the APIs can start more slowly than the UI. The user saw the UI ready while comments wasn't, and `podman ps` showed `smart-api` still `(starting)`. The UI link isn't held back for them.
    - If any isn't up when the UI is ready, it prints "APIs are still starting (usually under a minute)...". It then prints `smart-api is ready.`, `Comments API is ready.` and `Attachments API is ready.` as each comes up, including any that were already up at that point. If all three are already up, it prints `All APIs are ready.` (wording agreed with the user).
    - smart-api is checked at `http://localhost:8080/livez`. In option 2 that's the Gradle-run API, so the message also confirms when it has been started.
    - Comments is checked at `http://localhost:9082/actuator/health`. The first version of this check never reported ready:
      - The `smart-comments-api:1.0.46` image's admin server listens on 9082 inside the container (`Undertow started on port(s) 9082` in its logs), but compose mapped host 9082 to container 8082. The connection was reset.
      - The source of 9082 is unknown. The container env doesn't set `MANAGEMENT_SERVER_PORT`, and the repo's `application.yaml` (unchanged since 2024, so the same at tag `v1.0.46`) defaults to 8082. Possibly the `spring.config.import` of `.env`.
      - **Fix:** compose now sets `MANAGEMENT_SERVER_PORT=8082` for `smart-comments-api`, beside the existing `SERVER_PORT=8080` override, so the `9082:8082` mapping works. A Swagger-page check was tried in between and rejected by the user: use the real health endpoint.
      - `localhost:9080/actuator/health` returns 404, because actuator is only on the admin port.
    - Attachments is checked at `http://localhost:7080/livez`. `add-additional-paths: true` puts `/livez` on the main port, and its `SecurityConfig` allows it without auth.
    - Attachments sets its admin port to 7082 inside the container, but compose maps host 7082 to container 8082, so `localhost:7082` reaches nothing. That's a mismatch in the attachments repo config, and harmless here.
  - **No Swagger links:** the user found only the comments API's Swagger page loads (`localhost:9080/swagger-ui.html`). smart-api's and attachments' don't, so they were left out. The link was kept out of `src/bin/www.js` because that log runs in deployed environments too. An `EXIT` trap kills the loop.
  - **Startup checks (`check_setup`, run before the menu):**
    - **What it checks:**
      - `.env` exists.
      - `aws configure list-profiles` includes `$AWS_PROFILE`.
      - `service.local.smart.mcga.uk` resolves to `127.0.0.1`, checked with Node's `dns.lookup`, the same resolver the app uses.
      - A Podman machine exists.
    - **Output:** all problems are listed together, each naming the README section that fixes it, and then it exits. If the machine exists but isn't running, it runs `podman machine start` itself.
    - **The `/etc/hosts` entry is required, not optional.** The UI process reaches `SMART_API` and Redis through `service.local.smart.mcga.uk`, so `localhost:2997` alone isn't enough.
    - **Don't browse to `http://service.local.smart.mcga.uk`.** The user found it loads the start page with no CSS, and sign-in breaks; `https://` doesn't load at all.
      - The route works: `nginx` forwards to `smart-ui`, which in options 1 and 2 is the `external` container (`hostname: smart-ui`), and that forwards to the host on 2997.
      - The cause is helmet 6.2.0's default CSP, which includes `upgrade-insecure-requests`. `src/helmet.js` keeps the defaults, so the browser upgrades CSS requests and the sign-in form post to `https://`, and nothing listens on 443. Browsers exempt `localhost` from the upgrade.
      - Sign-in would probably also fail because of `APP_BASE_URL`-based redirects and cookies.
      - Deliberately not fixed, since the upgrade is right for deployed environments. The README tells people to browse to `localhost:2997`.
    - Tested here with stubbed `aws`, `node` and `podman`: everything missing, the wrong profile, a stopped machine, a running machine. The real DNS lookup returns `127.0.0.1` on the user's machine. It hasn't been run for real yet.
  - **Verified by the user (2026-10-23):** option 1 and option 3 (`full`) both run, and a repeat `mise run dev` was fine.
  - **Not yet run:**
    - option 2 (`api`, smart-api from its repo through Gradle)
    - the startup checks against a real missing `.env`, AWS profile, hosts entry or machine
    - an attachment upload since the `:-test` credential defaults
  - Tested here: menu validation (empty input, out-of-range input, an unknown argument, EOF). **Not yet run end to end on the user's machine.**
- **`mise run dev`** runs the whole flow:
  - SSO login, only when the session has expired
  - `ca:setup` and `npm install`, only when `package.json` or `package-lock.json` has changed (mise `sources`/`outputs`)
  - `ecr:login` and `podman compose up -d`
  - `npm start`
- **npm install-script denials:** `package.json` now has an `allowScripts` block that denies install scripts for all 9 flagged packages: `@parcel/watcher`, `preact`, `chromedriver`, `edgedriver`, `es5-ext`, `esbuild`, `fsevents` (both versions), `geckodriver`. It was written by `npm install-scripts deny --all`.
  - npm 11.19 already skips unapproved dependency install scripts by default, so this records the existing behaviour rather than changing it. The user confirmed `npm test` and WDIO pass with the scripts skipped.
  - The `npm warn install-scripts` block was deliberately not hidden. It's npm's supply-chain check (the worm-style npm attacks spread through install scripts). CI only has the ECR image scan for known vulnerabilities, with no `npm audit` and no Dependabot. With every package now approved or denied, the warning only appears for a new package with an install script, which is when it should be seen.
  - If something ever needs a script, use `npm install-scripts approve <pkg>`. It pins to the reviewed version by default.
- **`DEP0005` `Buffer()` deprecation warning fixed in `src/helmet.js`.**
  - Line 8 built the per-request CSP nonce with `new Buffer(randomUUID())`. It now uses `Buffer.from(randomUUID())`. The output is identical (checked with the same UUID); the nonce feeds the `<script nonce='{{cspNonce}}'>` tags in the views.
  - It only fired on the first request, not at startup, so startup-only checks missed it. It was found with `NODE_OPTIONS=--trace-deprecation npm start`, then loading a page.
  - The warning appeared as `error:` because `@mca/common-logger` redirects `console.error` to its logger.
  - It wasn't a real vulnerability: `Buffer()` is only unsafe with a number argument, and this was a string.
  - Confirmed by the user: the warning is gone.
- **Sass deprecation warnings silenced, not fixed.** The four categories are listed in `gulpfile.js`'s `silenceDeprecations`. The govuk `import-using-all` warning was fixed properly by importing `govuk/index`. The detail is in the local `CLAUDE.md` deferred list.
- **Deleted `.envrc.example`.** `AWS_ACCOUNT_NUMBER` was dropped because `scripts/podman-ecr-login.js` falls back to `aws sts get-caller-identity`. `.envrc` stays in `.gitignore` and `.npmignore` because devs still have local copies.
- **`README.md`:**
  - added a "mise setup" section (`mise trust`, `mise install`)
  - merged the AWS login, install and run sections into one `mise run dev` section
  - added a "Running the steps by hand" fallback
- **Rejected alternative: a Makefile.** It would have been a third tool next to mise and direnv.
- **Gotchas:**
  - Don't name a task `up`, because `mise up` means `mise upgrade`.
  - `mise trust` is needed once the config has `[env]` or `[tasks]`.
  - Keep direnv in the global mise config (`~/.config/mise/config.toml`) if other projects use it. Its shell hook runs at shell start, so it can't be installed per project. `~/Desktop/mca/beacons` still relies on it.
- **Not done:**
  - No `--wait` on compose. The `default` profile has nothing worth waiting for. There are no `healthcheck:` blocks in `docker-compose.yaml`; `service_healthy` relies on `HEALTHCHECK`s built into the DB and `smart-api` images.
  - Under `--wait`, `cert-gen` (a one-shot container) might count as a failure. This is untested.
  - The end-to-end `mise run dev` flow was verified by the user on 2026-10-23 with the `api` profile: SSO login, ECR, CodeArtifact, `npm install`, all containers up, UI listening on 2997, Redis connected. The unset made compose warn that the three AWS credential variables were not set, which led to the `test` defaults above. Attachment upload hasn't been tested since either change.

For smart-api: its `.tool-versions` includes `aws-vault`, which smart-ui dropped. If smart-api moves to mise too, use the same task names (`mise run dev`, `mise run down`, `mise run clean`) so there's one interface across the Node and Gradle repos.

## smart-api: to do (deferred by the user: "do the api later")

What's in the repo (checked on 2026-10-02, branch `trainee-retention-backend`; the Podman work will want its own branch):
- `docker-compose.yaml` runs only `postgres` (amd64 ECR image, with `platform: linux/amd64` already set, published on 5432) and `localstack` 3.1.0 (4566, SQS and S3, bootstrapped by `src/test/resources/localstack/bootstrap/createQueue.sh`). **The API itself runs on the host** through `./gradlew bootRunNoAuth`, `bootRunDev` or `bootRunLocalAuth`. Under Podman this already works (verified with `podman compose up` in smart-api).
- `localstack` mounts `/var/run/docker.sock`. It's only needed if localstack starts containers of its own (for example Lambda), and the only services enabled are `sqs,s3`. Health checks pass under Podman as things are. Either remove the mount, or confirm it resolves inside the rootful Podman machine.
- `README.md`:
  - **Line 69:** says to install Docker. Port over smart-ui's Podman setup section, including the Rosetta step.
  - **Lines 106-123:** recommend `aws-vault`. smart-ui dropped `aws-vault` in commit `727db09`, so check whether the team wants the same here (it's also in `.tool-versions`).
  - **Line 136:** `aws-vault exec ... | docker login`. Replace with the `podman login --compat-auth-file ~/.docker/config.json` form, or add an equivalent of `ecr:login`. smart-api has a `package.json`, but it's a Gradle project, so a small shell script or Gradle task may suit it better. Ask the user.
  - **Line 142:** `docker compose up` → `podman compose up`.
- `Jenkinsfile` uses legacy `docker-compose` (v1, hyphenated) and `docker build`/`push` on Docker Engine. Leave it alone; it's licence-compliant as it is.
- No Testcontainers in `build.gradle` (checked), so the Gradle tests don't need a Docker socket.

Likely the same pattern in sibling repos not yet looked at: `smart-comments-api`, `smart-attachments-api` (and their `*-test-db` repos). Check each repo's compose file for `127.0.0.11`, `172.17.0.1`, `docker.sock` and `host.docker.internal`, and its README for `docker login`/`docker compose`.

## Working conventions with this user

- Read-only git only. Never commit, stage, push or offer to; leave changes in the working tree and list the files changed.
- The user tests locally and pastes output back, so give exact commands to run and say what output to expect.
- The sandbox can't read `.env`, `.env.*`, `~/.aws` or `~/.docker/config.json`, or run Podman. Ask the user for output instead.
