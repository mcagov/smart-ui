#!/bin/bash

# load the TF_VARs with the latest image versions
# usage
# source ./latest-images.sh

function getLatest {
  package="$1"
  # crazy sort due to crap Mac bash
  echo -n "$(aws ecr describe-images --repository-name ${package} --registry-id 676563297163 --query 'sort_by(imageDetails,& imagePushedAt)[-1].imageTags' --output text | tr '\t' '\n' | grep -v latest| head -n 1)"
}

export TF_VAR_smart_ui_version="smart-ui:$(getLatest  "smart-ui")"

echo "using ui:    ${TF_VAR_smart_ui_version}"
