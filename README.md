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

### Required software

You will need [Podman](https://podman.io/) and [Docker Compose](https://docs.docker.com/compose/) installed. Please don't use Docker Desktop: it needs a paid licence for enterprise use. Podman and the standalone Docker Compose binary are both free and open source.

#### Podman setup (macOS)

If Docker Desktop is installed, uninstall it first so the two don't conflict.

Install Podman and Docker Compose:

```shell
brew install podman docker-compose
```

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

`podman compose` prints `>>>> Executing external compose provider ... <<<<` before every command. To hide it, add this to `~/.config/containers/containers.conf`:

```toml
[engine]
compose_warning_logs = false
```

The rest of this documentation will assume you are using:

- [mise-en-place](https://mise.jdx.dev/) to manage the required software (see the `.tool-versions` if you want to manage them some other way).
- [direnv](https://direnv.net/) to manage your shell environment.

### Configuration

Copy `.env.example` as `.env` and replace the placeholders with variables found within the contents of the "SMarT-UI .env contents", inside the SMarT 1Password Vault. Ensure you click 'EDIT' before you copy or else the hashtags won't copy as required. 

Copy `.envrc.example` as `.envrc`, replace the placeholders, then allow direnv
to load it:

```shell
direnv allow
```

Check it's loaded with `echo $AWS_PROFILE $AWS_ACCOUNT_NUMBER`. If you see
nothing, check that direnv is hooked into your shell
(for zsh, `eval "$(direnv hook zsh)"` in `~/.zshrc`).

Add the following to your `/etc/hosts` file

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

### AWS login

Log into AWS using:
```shell
aws sso login --profile=smart-dev-support
```

... and follow the steps that your default browser automatically shows.

Check it worked with `aws sts get-caller-identity`, which should show the
smart-dev account.

### Install dependencies

Before you install the dependencies you need to be logged into the CodeArtifact
repo, which you can do by running the following command:
```shell
npm run ca:setup
```

Then you can run the standard node dependency install command:
```shell
npm install
```

### Run the application

#### Run the backing services with Podman

Log into AWS Elastic Container Registry if the images need to be pulled:

```shell
npm run ecr:login
```

Run the backing services:

```shell
podman compose up
```

#### Run SMarT UI

```shell
npm start
```

The service will be available at `http://localhost:2997/`

All certificates required for Redis to run locally with TLS are generated by
a container (`cert-gen`), and saved into your local repo. This folder is
ignored by git but required for running locally, so please so not remove it.

### Run SMarT UI with your locally running SMarT API

[Run SMarT API with no authentication](https://github.com/mcagov/smart-api?tab=readme-ov-file#run-smart-api-with-no-authentication).

smart-api's `podman compose up` only starts its backing services (Postgres and
localstack). The API itself runs on your machine through Gradle, so start it as
well with `./gradlew bootRunNoAuth`, or `./gradlew bootRunLocalAuth` to match
`LOCAL_AUTH=true`. Check it's up at `http://localhost:8080/livez`. If the UI
reports `connect ECONNREFUSED 127.0.0.1:8080`, the API isn't running.

Change `COMPOSE_PROFILES` in your `.env` file to `COMPOSE_PROFILES=default,attachments,comments`.

[Run the application](#run-the-application).

### Run SMarT UI with Azure B2C authentication

Ensure your `COMPOSE_PROFILES` in your `.env` is set to `COMPOSE_PROFILES=default,attachments,comments`

Then make sure the following are set in the `.env` file too...

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
