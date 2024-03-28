FROM 676563297163.dkr.ecr.eu-west-2.amazonaws.com/node:20.10.0

ARG UI_VERSION=""

RUN \
    --mount=type=secret,id=npmrc,dst=/home/app/.npmrc,uid=1000,required=true  \
    --mount=type=cache,mode=0755,uid=1000,target=/home/app/.npm \
    npm install --production @mca/smart-ui@${UI_VERSION}

WORKDIR /home/app/node_modules/@mca/smart-ui

COPY ./replace/template.njk /home/app/node_modules/govuk-frontend/govuk/components/header

EXPOSE 3000

CMD [ "node", "./src/bin/www.js" ]

