import {execSync} from 'child_process';

function configureCodeArtifact() {
  const accountId = getAccountId();
  const region = process.env.AWS_REGION || 'eu-west-2';
  const domain = 'mcga';
  const repo = 'mcga-npm';

  const registryUrl = `${domain}-${accountId}.d.codeartifact.${region}.amazonaws.com/npm/${repo}/`;

  try {
    console.log(`Fetching CodeArtifact token for account ${accountId}...`);
    const tokenCommand = `aws codeartifact get-authorization-token --domain ${domain} --domain-owner ${accountId} --query authorizationToken --output text`;
    const token = execSync(tokenCommand).toString().trim();
    console.log('Setting registry URL...');
    execSync(`npm config --location=project set registry https://${registryUrl}`, { stdio: 'inherit' });
    console.log('Setting authentication token...');
    const authKey = `//${registryUrl}:_authToken`;
    execSync(`npm config --location=project set "${authKey}" "${token}"`);
    console.log(' [SUCCESS]: CodeArtifact configured successfully.');
  } catch (error) {
    console.error(' [FATAL]: Configuration failed.');
    console.error(error.stderr?.toString() || error.message);
    process.exit(1);
  }
}

function getAccountId() {
  if (process.env.AWS_DEV_ACCOUNT_ID) {
    return process.env.AWS_DEV_ACCOUNT_ID;
  }
  try {
    console.log('AWS_DEV_ACCOUNT_ID not found in env. Attempting to fetch from AWS CLI...');
    return execSync('aws sts get-caller-identity --query Account --output text').toString().trim();
  } catch (error) {
    console.error(' [ERROR]: Could not retrieve AWS Account ID from environment or AWS CLI.');
    process.exit(1);
  }
}

configureCodeArtifact();
