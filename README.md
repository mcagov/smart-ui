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

SMarT runs on [mise-en-place](https://mise.jdx.dev/), [Podman](https://podman.io/)
and [Docker Compose](https://docs.docker.com/compose/). Please don't use Docker
Desktop: it needs a paid licence for enterprise use. If it's installed,
uninstall it first so it doesn't conflict with Podman.

### Setup

1. On Apple Silicon Macs, install Rosetta. It may ask for your Mac password:

   ```shell
   softwareupdate --install-rosetta --agree-to-license
   ```

2. With [Homebrew](https://brew.sh/) installed, install mise and clone the repo:

   ```shell
   brew install mise
   git clone https://github.com/mcagov/smart-ui.git
   cd smart-ui
   ```

3. Create your `.env`, then fill it in with the values in "SMarT-UI .env
   contents", inside the SMarT 1Password vault. Click 'EDIT' before you copy,
   or the hashtags won't copy:

   ```shell
   cp .env.example .env
   ```

4. Run the setup. If it ends with a "Still to do" list, do those, then run it
   again:

   ```shell
   mise trust
   mise run setup
   ```

### Run the application

1. Start SMarT, and choose how to run it when asked. Option 1, Local UI dev, is
   the usual choice. The first run takes a while, as it downloads several GB of
   container images:

   ```shell
   mise run dev
   ```

2. Browse to `http://localhost:2997`. Not `http://service.local.smart.mcga.uk`:
   sign-in fails there, because the app's security policy upgrades requests to
   HTTPS on any host other than localhost.

3. When you've finished, stop SMarT UI with Ctrl+C, then stop the containers:

   ```shell
   mise run down
   ```

### Mise Tasks

A quick rundown of the available `mise` tasks that are available.

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

For what the setup and `mise run dev` do in detail, the `--logs` option and
doing the setup by hand, see [.mise/README.md](.mise/README.md).

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
Actions/Build, test and release in the repo, clicking on Run workflow,
selecting the correct branch you wish to use, and then checking the
`Build and push test container to ECR` checkbox. This will build a new
container to the ECR repository, which you can then use the smart-deploy
pipeline in Jenkins to deploy to the EKS cluster.

TODO: deploy from within the github workflow.

#### Image signing

Every image the workflow pushes to ECR (master releases and `-TEST` images) is
signed with [cosign](https://docs.sigstore.dev/cosign/) using keyless
signing. The signer is the workflow run itself, identified by its GitHub OIDC
token; there are no signing keys to manage. Signatures are stored in ECR as
OCI referrers of the image: untagged entries linked to the image they sign.
Don't delete them by hand.

To verify an image locally (cosign installed, logged in to ECR):

```bash
cosign verify \
  --certificate-identity "https://github.com/mcagov/smart-ui/.github/workflows/build-test-release.yml@refs/heads/master" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  <account>.dkr.ecr.eu-west-2.amazonaws.com/smart-ui:<version>
```

For a `-TEST` image, replace `refs/heads/master` with `refs/heads/<branch>`.
Verification fails for unsigned images and for images signed from a different
branch.

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
