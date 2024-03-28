#!/usr/bin/env bash

set -euo pipefail

# enable debug
# set -x

echo "Configuring S3"
echo "==================="
LOCALSTACK_HOST=localhost
AWS_REGION=${AWS_DEFAULT_REGION}

create_bucket() {
    local BUCKET_NAME_TO_CREATE=$1
    echo  "awslocal --endpoint-url=http://${LOCALSTACK_HOST}:4566 s3 mb s3://${BUCKET_NAME_TO_CREATE} --region ${AWS_REGION} "
    awslocal --endpoint-url=http://${LOCALSTACK_HOST}:4566 s3 mb s3://${BUCKET_NAME_TO_CREATE} --region ${AWS_REGION}
    awslocal --endpoint-url=http://${LOCALSTACK_HOST}:4566 s3api put-bucket-cors --bucket ${BUCKET_NAME_TO_CREATE} --cors-configuration '{"CORSRules" : [{"AllowedHeaders":["Authorization"],"AllowedMethods":["GET","HEAD"],"AllowedOrigins":["https://service.local.smart.mcga.uk"],"ExposeHeaders":["Access-Control-Allow-Origin"]}]}'

}

if [[ -z "$AWS_PRIVATE_BUCKET" ]] ; then
    echo "ERROR: AWS_PRIVATE_BUCKET not set"
    exit 1
fi

create_bucket "${AWS_PRIVATE_BUCKET}"