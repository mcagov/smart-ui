#!/bin/bash

#
# copy cert files form ssm to local nginx ssl folder
#

FULL_PATH_TO_SCRIPT="$(realpath "$0")"
SCRIPT_DIRECTORY="$(dirname "$FULL_PATH_TO_SCRIPT")"
NGINX_CERTS_DIR="$(realpath ${SCRIPT_DIRECTORY}/../test/nginx/ssl/)"

if [ ! -d "${NGINX_CERTS_DIR}" ]
then
    echo "Directory ${NGINX_CERTS_DIR} DOES NOT exists."
    exit 1
fi

function saveSsmValue {
  ssm_path="$1"
  output_path="$2"
  aws ssm get-parameter --name "${ssm_path}" --region eu-west-2 --query "Parameter.Value" --output text > "${output_path}"
  echo "saved ${output_path}"
}

docker-compose down
rm -rf "${NGINX_CERTS_DIR}"/*
saveSsmValue "/local/tls/cert" "${NGINX_CERTS_DIR}/service.local.smart.mcga.uk-cert.pem"
saveSsmValue "/local/tls/issuer" "${NGINX_CERTS_DIR}/service.local.smart.mcga.uk-issuer.pem"
saveSsmValue "/local/tls/fullchain" "${NGINX_CERTS_DIR}/service.local.smart.mcga.uk-fullchain.pem"
saveSsmValue "/local/tls/key" "${NGINX_CERTS_DIR}/service.local.smart.mcga.uk-key.pem"
saveSsmValue "/local/tls/ca" "${NGINX_CERTS_DIR}/service.local.smart.mcga.uk-root-ca.pem"