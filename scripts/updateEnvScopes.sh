#!/bin/bash

help()
{
   # Display Help
   echo
   echo "Update the scopes in the .env file."
   echo
   echo "Syntax: $0"
   echo
}

REGION="$AWS_REGION"
[ -z "${REGION}" ] && echo "AWS_REGION must be set" && help && exit 1


OKTA_SCOPE_AB="$(aws ssm get-parameters --names "/dev/scopes/ab" --query "Parameters[].Value" --output text)"
OKTA_SCOPE_TP="$(aws ssm get-parameters --names "/dev/scopes/tp" --query "Parameters[].Value" --output text)"

sed -i -e '/OKTA_SCOPE_\(AB\|TP\)\s*=/d' .env
# Todo: On MacOS, the following line results in...
# sed: 1: ":a": unused label 'a'
# sed: -e: No such file or directory
sed -i -e :a -e '/^\n*$/{$d;N;ba' -e '}' .env

echo -e "" >> .env
echo "OKTA_SCOPE_AB=\"${OKTA_SCOPE_AB}\"" >> .env
echo "OKTA_SCOPE_TP=\"${OKTA_SCOPE_TP}\"" >> .env
echo "" >> .env
