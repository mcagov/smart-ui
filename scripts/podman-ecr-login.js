import {execSync} from 'child_process';
import {mkdirSync} from 'fs';
import {homedir} from 'os';
import {join} from 'path';

// Local development only - CI logs into ECR with Docker Engine directly
function loginToEcr() {
  const accountId = getAccountId();
  const region = process.env.AWS_REGION || 'eu-west-2';
  const registry = `${accountId}.dkr.ecr.${region}.amazonaws.com`;

  const dockerConfigDir = join(homedir(), '.docker');
  const authFile = join(dockerConfigDir, 'config.json');

  try {
    console.log(`Fetching ECR login password for account ${accountId}...`);
    const password = execSync(`aws ecr get-login-password --region ${region}`).toString().trim();
    console.log(`Logging Podman into ${registry}...`);
    mkdirSync(dockerConfigDir, { recursive: true });
    execSync(`podman login --compat-auth-file "${authFile}" --username AWS --password-stdin ${registry}`, {
      input: password,
      stdio: ['pipe', 'inherit', 'inherit']
    });
    console.log(' [SUCCESS]: Logged into ECR.');
  } catch (error) {
    console.error(' [FATAL]: ECR login failed.');
    console.error(error.stderr?.toString() || error.message);
    process.exit(1);
  }
}

function getAccountId() {
  const accountId = process.env.AWS_DEV_ACCOUNT_ID || process.env.AWS_ACCOUNT_NUMBER;
  if (accountId) {
    return accountId;
  }
  try {
    console.log('AWS_DEV_ACCOUNT_ID / AWS_ACCOUNT_NUMBER not found in env. Attempting to fetch from AWS CLI...');
    return execSync('aws sts get-caller-identity --query Account --output text').toString().trim();
  } catch (error) {
    console.error(' [ERROR]: Could not retrieve AWS Account ID from environment or AWS CLI.');
    process.exit(1);
  }
}

loginToEcr();
