# Local development tasks

This folder holds the [mise](https://mise.jdx.dev/) tasks behind the setup in
the [main README](../README.md#local-development). The longer tasks are scripts
in `tasks/`. The short ones are defined in `mise.toml` at the repo root.

| Task | What it does |
|---|---|
| `mise run setup` | Installs and configures everything SMarT needs to run locally |
| `mise run dev` | Checks your setup, starts the backing services and runs SMarT UI |
| `mise run ui-logs` | Follows SMarT UI's logs (options 1 and 2) |
| `mise run logs` | Follows the containers' logs: all of them, or the services you name |
| `mise run down` | Stops the containers, keeping their data |
| `mise run clean` | Removes this project's containers and volumes, including the database data |
| `mise run aws-login` | Logs into AWS SSO if your session has expired |
| `mise run deps` | Refreshes the CodeArtifact token and runs `npm install` when the lockfile changes |
| `mise run services` | Logs Podman into ECR and starts the backing services |

Run `mise tasks` to list them.

## `mise run setup`

It skips anything that's already done, so it's safe to run again. In order, it:

1. checks `.env` exists and has been filled in
2. installs Podman and Docker Compose from the `Brewfile`, and warns if Docker
   Desktop is installed, as it can conflict with Podman
3. on Apple Silicon, checks Rosetta is installed
4. on Apple Silicon, turns Rosetta on in `~/.config/containers/containers.conf`
5. creates and starts the Podman machine. On Apple Silicon it waits until
   Rosetta is installed, because a machine created without it has to be
   recreated later
6. installs Node, the AWS CLI, Terraform and cosign, at the versions in
   `mise.toml`
7. adds the `smart-dev-support` AWS profile, after asking for the smart-dev
   account number from the AWS access portal
8. checks `/etc/hosts` has the `service.local.smart.mcga.uk` entry

It never uses `sudo`. At the end it lists anything left for you to do, such as
adding the `/etc/hosts` entry (see [Configuration](#configuration)).

## `mise run dev`

It first checks your setup: the `.env` file, the `smart-dev-support` AWS
profile, the `/etc/hosts` entry and the Podman machine. If anything's missing,
it lists every problem and tells you to run `mise run setup`, then stops. If the
Podman machine exists but is stopped, it starts it for you.

You'll be asked how you want to run SMarT:

| Option | Compose profiles | SMarT UI runs |
|---|---|---|
| 1. Local UI dev | `default,api` | on your machine, with hot reloading |
| 2. Local API dev | `default,attachments,comments` | on your machine, with hot reloading. Start smart-api from its own repo (see the [main README](../README.md#run-smart-ui-with-your-locally-running-smart-api)) |
| 3. All containers | `full` | in the `smart-ui` container, without hot reloading |

To skip the question, pass the option's name: `mise run dev ui`,
`mise run dev api` or `mise run dev full`. The option you pick overrides
`COMPOSE_PROFILES` in your `.env`.

Then it:

1. Stops any containers that aren't part of the option you picked, so they
   don't hold ports the new option needs.
2. Logs you into AWS SSO if your session has expired. Follow the steps your
   default browser shows.
3. Refreshes the CodeArtifact token and runs `npm install`, but only when
   `package.json` or `package-lock.json` has changed since the last install.
4. Logs Podman into AWS Elastic Container Registry and starts the backing
   services in the background.
5. Runs SMarT UI, then once it's answering prints its link
   (`http://localhost:2997`) and smart-api's health check
   (`http://localhost:8080/livez`). Cmd+click a link to open it, or
   Shift+click if you use tmux with mouse mode on. For option 3, SMarT UI runs
   in its container instead, so `mise run dev` waits until the UI and the APIs
   are ready, then hands your terminal back.

The containers always run in the background. In options 1 and 2 the terminal
is only taken up by SMarT UI itself, so you get hot reloading and can stop it
with Ctrl+C. Stopping it leaves the containers running.

The first run takes longer: it installs the npm dependencies and downloads
several GB of container images. Later runs reuse both.

The APIs often take up to a minute longer to start than the UI. Once the UI is
ready, you'll see how many APIs are starting, then a count as each one comes
up, in whatever order they're ready:

```text
3 APIs starting up...
1/3 Comments API is ready.
2/3 smart-api is ready.
3/3 Attachments API is ready.
All 3 APIs are ready.
```

The parts of the UI that use an API won't work until it's ready.

### Logs

SMarT UI's logs don't show in the terminal. In options 1 and 2 they go to
`smart-ui.log` at the repo root, which is replaced on every run. Follow them
from another terminal with:

```shell
mise run ui-logs
```

If SMarT UI stops with an error, `mise run dev` prints the end of the log.
To see the logs in the terminal instead, add `--logs`, for example
`mise run dev ui --logs`. With option 3, `--logs` follows the `smart-ui`
container's logs once everything is ready.

Follow the containers' logs, either all of them or only the services you name:

```shell
mise run logs
mise run logs smart-ui smart-api
```

Ctrl+C stops following the logs. The containers keep running.

### Stopping

`mise run down` only stops the containers, so the next `mise run dev` starts the
same ones again with your database data intact.

`mise run clean` stops and removes this project's containers and volumes
(including the database data) for every compose profile, not just the ones in
your `.env`. Pulled images are kept, so the next `mise run dev` doesn't download
them again.

### Running the steps by hand

If a step fails, you can run each one separately:

```shell
aws sso login
npm run ca:setup
npm install
npm run ecr:login
podman compose up -d
npm start
```

Check the AWS login worked with `aws sts get-caller-identity`, which should
show the smart-dev account.

All certificates required for Redis to run locally with TLS are generated by
a container (`cert-gen`), and saved into your local repo. This folder is
ignored by git but required for running locally, so please do not remove it.

## Doing the setup by hand

If `mise run setup` can't do a step, or you'd rather do it yourself, these are
the same steps by hand.

Install the tools:

```shell
brew install mise podman docker-compose
```

### Podman (macOS)

**On Apple Silicon Macs, turn on Rosetta before creating the machine.** Our ECR
images (Redis, the APIs and the databases) are built for Intel (`amd64`) only.
Podman turns Rosetta off by default, so without this step those images run
under QEMU emulation instead:

1. Make sure Rosetta is installed on your Mac:

```shell
softwareupdate --install-rosetta --agree-to-license
```

2. Add the following to `~/.config/containers/containers.conf`, creating the
file if it doesn't exist:

```toml
[machine]
rosetta = true
```

This only takes effect when a machine is created. If you already have a Podman
machine, recreate it with `podman machine stop && podman machine rm`, then
follow the next step. Recreating the machine deletes its pulled images and volumes.

Create and start the Podman virtual machine:

```shell
podman machine init --rootful --cpus 4 --memory 8192
podman machine start
```

- `--rootful` lets nginx bind ports 80 and 443.
- The backing services are memory hungry, so we need to use at least 8GB of ram.

Check it's working:

```shell
podman compose version
```

On Apple Silicon, also check Rosetta is active. The first command should print `true`, and the second should list a `rosetta` entry:

```shell
podman machine inspect --format '{{.Rosetta}}'
podman machine ssh ls /proc/sys/fs/binfmt_misc/
```

`podman compose` runs the `docker-compose` binary you installed against Podman,
so the existing `docker-compose.yaml` works without changes. If you see a
message about `podman-compose` instead, check that `docker-compose` is on your
`PATH`.

Inside this repo, mise sets `DOCKER_CONFIG` to `~/.config/smart-ui/docker`, so
`docker-compose` uses the ECR login from `npm run ecr:login` and ignores
`~/.docker/config.json`. Docker Desktop's `credsStore` setting in that file
would otherwise hand `docker-compose` an old ECR token, and pulls fail with
"credentials are stale".

`podman compose` prints `>>>> Executing external compose provider ... <<<<`
before every command. Inside this repo, mise hides it by setting
`PODMAN_COMPOSE_WARNING_LOGS=false`. To hide it everywhere, add this to
`~/.config/containers/containers.conf`:

```toml
[engine]
compose_warning_logs = false
```

### mise tools

mise installs the project's tools (Node, the AWS CLI, Terraform, cosign), sets
`AWS_PROFILE` whenever you're in the repo, and runs the local development tasks.
All of this is defined in `mise.toml`. From the repo, trust the config and
install the tools:

```shell
mise trust
mise install
```

mise also unsets any `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and
`AWS_SESSION_TOKEN` left in your shell, so they can't override the SSO profile.

Optionally, hook mise into your shell (for zsh) so `AWS_PROFILE` and the tool
versions also apply when you run commands like `npm start` or `aws` yourself:

```shell
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
```

`mise run` tasks don't need this.

### Configuration

Add the following to your `/etc/hosts` file. SMarT UI uses this name to reach
the APIs and Redis, so it's needed even if you browse to `localhost`:

```text
# SMarT UI
127.0.0.1 service.local.smart.mcga.uk
```

Add the following to your `~/.aws/config` file

```text
[profile smart-dev-support]
sso_start_url=https://mcaconsole.awsapps.com/start/#
sso_region=eu-west-2
sso_account_id=<smart_dev_aws_account_number_as_found_for_smart_dev_account_in_the_aws_console>
sso_role_name=SMarTSupportAccess
region=eu-west-2
output=json
```
