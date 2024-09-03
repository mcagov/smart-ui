FROM 009543623063.dkr.ecr.eu-west-2.amazonaws.com/node:latest

ARG UI_VERSION="0.2.1"

RUN aws codeartifact login --tool npm --repository mcga-npm --domain mcga --domain-owner 009543623063 --region eu-west-2 --profile SMarTSupportAccess-009543623063

RUN \
    --mount=type=secret,id=npmrc,dst=/home/app/.npmrc,uid=1000,required=true  \
    --mount=type=cache,mode=0755,uid=1000,target=/home/app/.npm \
    npm install --production @mca/smart-ui@0.2.1

WORKDIR /home/app/node_modules/@mca/smart-ui

COPY ./replace/template.njk /home/app/node_modules/govuk-frontend/govuk/components/header

EXPOSE 3000

CMD [ "node", "./src/bin/www.js" ]

