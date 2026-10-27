# SMarT UI

[Skip to Local Development](#local-development).

## A bit of technical background information

### GOV.UK express

This is a working NodeJS (express) web application that uses the [GOV.UK frontend](https://github.com/alphagov/govuk-frontend)
and adheres to the [GOV.UK Design System](https://design-system.service.gov.uk).

It also acts as the standard for how an express project should be structured, and what files are expected.

It can be copied and used at the starting point for any new web app.

### Project structure

NodeJS services in the MCA follow the express [routes/controllers](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/routes)
pattern, along with [service classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes) that CRUD data.

```
    src
    +-- bin
    |   -- www
    |   controllers
    |   routes
    |   views
    |   services
    |   ...
    test
    --- web
    --- services
    --- ...
```

### View templating

This project uses [nunjucks](https://mozilla.github.io/nunjucks/) for its view templating.

## Local development

These instructions assume you're on the SMarT team and already have access to:

- the smart-dev AWS account through SSO, with the `SMarTSupportAccess` role
- the SMarT 1Password vault

Without these, the private packages, container images and configuration this
app needs won't be available.

### Required software

You will need [mise-en-place](https://mise.jdx.dev/), [Podman](https://podman.io/) and [Docker Compose](https://docs.docker.com/compose/) installed. Please don't use Docker Desktop: it needs a paid licence for enterprise use. Podman and the standalone Docker Compose binary are both free and open source.

If Docker Desktop is installed, uninstall it first so the two don't conflict.
Then, with [Homebrew](https://brew.sh/), install everything in one go:

```shell
brew install mise podman docker-compose
```

Clone this repo and change into it:

```shell
git clone https://github.com/mcagov/smart-ui.git
cd smart-ui
```

#### Podman setup (macOS)

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

`podman compose` prints `>>>> Executing external compose provider ... <<<<`
before every command. Inside this repo, mise hides it by setting
`PODMAN_COMPOSE_WARNING_LOGS=false`. To hide it everywhere, add this to
`~/.config/containers/containers.conf`:

```toml
[engine]
compose_warning_logs = false
```

#### mise setup

mise installs the project's tools (Node, the AWS CLI, Terraform), sets
`AWS_PROFILE` whenever you're in the repo, and runs the local development tasks.
All of this is defined in `mise.toml`.

Hook mise into your shell (for zsh):

```shell
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
```

Open a new terminal, then from the repo trust the config and install the tools:

```shell
mise trust
mise install
```

Check it's loaded with `echo $AWS_PROFILE`, which should print
`smart-dev-support`. mise also unsets any `AWS_ACCESS_KEY_ID`,
`AWS_SECRET_ACCESS_KEY` and `AWS_SESSION_TOKEN` left in your shell, so they
can't override the SSO profile.

Run `mise tasks` to see every available task.

### Configuration

Copy `.env.example` as `.env` and replace the placeholders with variables found within the contents of the "SMarT-UI .env contents", inside the SMarT 1Password Vault. Ensure you click 'EDIT' before you copy or else the hashtags won't copy as required. 

Add the following to your `/etc/hosts` file. SMarT UI uses this name to reach
the APIs and Redis, so it's needed even if you browse to `localhost`:

```text
# SMarT UI
127.0.0.1 service.local.smart.mcga.uk
```

Always browse to `http://localhost:2997`. `http://service.local.smart.mcga.uk`
loads the start page without styles, and sign-in fails there, because the app's
security policy upgrades requests to HTTPS on any host other than localhost.

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

### Run the application

```shell
mise run dev
```

It first checks your setup: the `.env` file, the `smart-dev-support` AWS
profile, the `/etc/hosts` entry and the Podman machine. If anything's missing,
it lists every problem and the README section that fixes it, then stops. If the
Podman machine exists but is stopped, it starts it for you.

You'll be asked how you want to run SMarT:

| Option | Compose profiles | SMarT UI runs |
|---|---|---|
| 1. Local UI dev | `default,api` | on your machine, with hot reloading |
| 2. Local API dev | `default,attachments,comments` | on your machine, with hot reloading. Start smart-api from its own repo (see [below](#run-smart-ui-with-your-locally-running-smart-api)) |
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
   Shift+click if you use tmux with mouse mode on. For option 3, it follows the
   `smart-ui` container's logs instead of running SMarT UI on your machine.

The first run takes longer: it installs the npm dependencies and downloads
several GB of container images. Later runs reuse both.

The APIs often take up to a minute longer to start than the UI. If any are
still starting, you'll see a message saying so, then `smart-api is ready.`,
`Comments API is ready.` and `Attachments API is ready.` as each one comes up.
The parts of the UI that use an API won't work until it's ready.

Stop the backing services with:

```shell
mise run down
```

This only stops the containers, so the next `mise run dev` starts the same
ones again with your database data intact.

To start from scratch, stop and remove this project's containers and volumes
(including the database data) for every compose profile, not just the ones in
your `.env`:

```shell
mise run clean
```

Pulled images are kept, so the next `mise run dev` doesn't download them again.

Use `podman compose logs -f` to follow the backing services' logs.

#### Running the steps by hand

If a step fails, you can run each one separately:

```shell
aws sso login
npm run ca:setup
npm install
npm run ecr:login
podman compose up
npm start
```

Check the AWS login worked with `aws sts get-caller-identity`, which should
show the smart-dev account.

All certificates required for Redis to run locally with TLS are generated by
a container (`cert-gen`), and saved into your local repo. This folder is
ignored by git but required for running locally, so please do not remove it.

### Run SMarT UI with your locally running SMarT API

[Run SMarT API with no authentication](https://github.com/mcagov/smart-api?tab=readme-ov-file#run-smart-api-with-no-authentication).

smart-api's `podman compose up` only starts its backing services (Postgres and
localstack). The API itself runs on your machine through Gradle, so start it as
well with `./gradlew bootRunNoAuth`, or `./gradlew bootRunLocalAuth` to match
`LOCAL_AUTH=true`. Check it's up at `http://localhost:8080/livez`. If the UI
reports `connect ECONNREFUSED 127.0.0.1:8080`, the API isn't running.

Then [run the application](#run-the-application) and choose option 2,
Local API dev. It warns you if the API isn't answering yet.

### Run SMarT UI with Azure B2C authentication

Run the application with option 2, Local API dev (`mise run dev api`).

Make sure the following are set in the `.env` file too...

```shell
NODE_ENV=dev
LOCAL_AUTH=false
```

You also need to run the main SMART-API in dev mode too. Instructions on how to
do this are in the SMarT-API readme.  

### Testing

There are four ways to test this app.

#### Unit tests

```shell
npm run test
```

This suite is a mix of true unit tests (fully mocked, no external dependencies)
and integration-style tests that hit the real, containerised SMarT API - it's
not a clean unit/integration split yet, but everything in it passes as long as
the backing services are running (`podman compose up` with the `api` profile,
same as for local development).

#### Live Okta integration tests

```shell
npm run test:integration
```

These test `OktaUsers` against a real Okta org rather than a mock or the
containerised API. They're deliberately excluded from both CI pipelines (GitHub
Actions and Jenkins) - they need real Okta credentials, and have caused
permission issues when run in Jenkins/Github but we are looking into
integrating them into the pipelines soon.

#### BDD (Cucumber) tests

```shell
npm run test:bdd
```

Like the unit tests, these need the containerised SMarT API running. They're
wired into both CI pipelines.

#### WDIO (end-to-end browser) tests

```shell
npm run test:wdio-headless
```

Full end-to-end tests driving a real browser against the fully running app
(`podman compose up` with the `full` profile). See `test/wdio-headless.conf.js`
/ `test/wdio-chrome.conf.js` for configuration.

### Kubernetes and the Cross Account Administrator login

There is a file `/scripts/kube_login_smart.sh` that enables a quick way to
assume the Cross Account Administrator IAM role for SMarT.

You will need this role when using terraform, as well as when you access
Kubernetes from the terminal.

When running the script, simply follow the instructions provided. If you are
using the IAM role for terraform only, you don't need to use the kubernetes login
command. 

### Github Actions Development

When you push a PR, commit to a PR, or merge to master, a pipeline will run the
tests - currently the unit tests, the Cucumber (BDD) tests and the WDIO tests.
The live Okta integration tests are not run in CI (see [Testing](#testing)).
You can create a test container for use in dev/staging by going to
Actions/SMarT-UI CI/CD Pipeline in the repo, clicking on Run workflow,
selecting the correct branch you wish to use, and then checking the
`Build and push test container to ECR` checkbox. This will build a new
container to the ECR repository, which you can then use the smart-deploy
pipeline in Jenkins to deploy to the EKS cluster.

TODO: deploy from within the github workflow.

### SMarT UI: Overview

SMarT UI is a Node.js and Express website that shows GOV.UK‑style pages and
talks to the SMarT API to get and update data. It uses Nunjucks templates,
Superagent for API calls, and OIDC (Okta in production, a simple mock in
development) for sign‑in and sessions.

1. Main Flow (3 steps)
   1.     User request and login
            	The browser sends a request to Express ( src/app.js  and  src/routes/ ).
            	OIDC code checks the session and adds user info and an access token if the user is signed in.
   2.     Controller and service
           	A controller (for example,  src/controllers/tptrainees.js ) reads inputs, runs validation, and decides what to do.
           	It calls a service (for example,  src/services/trainees.js ), which uses Superagent and the access token to call the SMarT API.
   3.     Build and return the page
                  The service returns data to the controller.
                	The controller renders a Nunjucks template (for example,  src/views/tptrainees/trainee.html ) and sends the final HTML page back to the browser.

2. Key Building Blocks

         	Routes ( src/routes/ ): Define URLs and connect them to controllers and middleware.
         	Controllers ( src/controllers/ ): Decide what should happen for each request, including validation and navigation.
         	Services ( src/services/ ,  WebService.js ): Talk to the SMarT API and return data.
         	Auth ( local-oidc.js , Okta): Handle login and user roles via OIDC.

3. One‑line End‑to‑End View

   User → Route/Auth → Controller/Service → SMarT API → Controller/View → User
