pipeline {
    agent any

    options {
        timestamps()
        ansiColor('xterm')
        buildDiscarder(logRotator(numToKeepStr:'10'))
        disableConcurrentBuilds()
    }

    environment {
        NODE_ENV = 'local'
        POSTGRES_DB = 'smart'
        SMART_API = 'http://service.local.smart.mcga.uk:8080'
        COMMENTS_API = 'http://service.local.smart.mcga.uk:9080'
        ATTACHMENTS_API = 'http://service.local.smart.mcga.uk:7080'
        UI_URL = 'https://service.local.smart.mcga.uk'
        HOST = 'service.local.smart.mcga.uk'
        //DOCKER = credentials('devtools/docker-hub')
        // SONAR_ORG = "${env.JOB_NAME.toLowerCase().split('/')[0]}"
        // SONAR_PROJECT = "${env.JOB_NAME.toLowerCase().split('/')[1]}"
        // SONAR_TOKEN = credentials('devtools/sonar-token')
        LOGGER_TYPE = 'file'
        LOGGER_LEVEL = 'info'
        LOGGER_COLOURIZE = 'false'
        COMPOSE_INTERACTIVE_NO_CLI = '1'
        DOCKER_REGISTRY = '009543623063.dkr.ecr.eu-west-2.amazonaws.com'
        DOCKER_OPTS = '--pull --compress --no-cache=true --force-rm=true --progress=plain'
        DOCKER_BUILDKIT = '1'
        ENABLE_XRAY = false
        AWS_XRAY_CONTEXT_MISSING = 'LOG_ERROR'
        AWS_XRAY_LOG_LEVEL = 'silent'
        AWS_REGION = 'eu-west-2'
        AWS_PRIVATE_BUCKET = 'mcauk-smart-dev-attachments'
        APP_BASE_URL = 'http://service.local.smart.mcga.uk'
        LOCAL_AUTH = 'true'
        SESSION_SECRET = '34b9b922-114c-4cc8-b5f9-b029ebe86f59'
        OKTA_ORG_URL = 'https://id.preprod.mcga.uk/'
        OKTA_AUD = 'api://mcauk-smart-dev'
        OKTA_SCOPE = 'openid profile offline_access'
        OKTA_REDIRECT_URI = 'https://service.local.smart.mcga.uk/authorization-code/callback'
        OKTA_ISSUER_URL = 'https://id.preprod.mcga.uk/oauth2/ausbuj5bluwtaUnO40x7'
        OKTA_CLIENT_ID = '0oabsafq0qdYfzmu70x7'
        ENABLE_REDIS = 'true'
        REDIS_PASSWORD = 'V*.L=pL9B[kwM8d+'
        REDIS_HOST = 'service.local.smart.mcga.uk'
        REDIS_TLS = 'true'
        REDIS_PORT = '6379'
        CUCUMBER_PUBLISH_ENABLED = 'false'
        API_SPRING_PROFILES = 'default, dev, test,local-auth'
        JAVA_ENV = 'local'
        NODE_OPTIONS = "--experimental-vm-modules --experimental-specifier-resolution=node"
        ATTACHMENTS_BUCKET = 'mcauk-smart-dev-attachments'
        STAGING_BUCKET='mcauk-smart-dev-staging-attachments'
        EVENTS_QUEUE_URL="http://sqs.eu-west-2.aws.local.smart.mcga.uk:4566/000000000000/mcauk-smart-dev-events"
        AWS_CREDENTIALS_ID = 'aws-jenkins-service-account-credentials' // ID for AWS credentials in Jenkins
        GITHUB = credentials('github-ssh')
        SAFE_BRANCH = "${env.BRANCH_NAME.replaceAll('/', '-')}"
    }

    parameters {
        booleanParam(name: 'PUSH_TEST_CONTAINER', defaultValue: false, description: 'If checked, builds and pushes a test container to ECR')
    }

    stages {
        stage('Authenticate to ECR') {
             steps {
                withCredentials([aws(credentialsId: "${AWS_CREDENTIALS_ID}", accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                    script {
                        def AWS_PASSWORD = sh(script: "aws ecr get-login-password --region ${AWS_REGION}", returnStdout: true).trim()
                        sh "echo ${AWS_PASSWORD} | docker login --username AWS --password-stdin 009543623063.dkr.ecr.${AWS_REGION}.amazonaws.com"
                        sh "aws codeartifact login --tool npm --repository mcga-npm --domain mcga --domain-owner 009543623063 --region eu-west-2 --profile SMarTSupportAccess-009543623063"
                    }
                }
            }
        }
        stage('build and test') {
            agent {
                docker {
                    image '009543623063.dkr.ecr.eu-west-2.amazonaws.com/jenkins-npm-ci:latest'
                    alwaysPull true
                    args '-v /var/run/docker.sock:/var/run/docker.sock -v /var/lib/jenkins/.npm:/home/jenkins/.npm'
                }
            }
            stages{
                stage('setup'){
                    steps {
                        script {
                            scmSkip(deleteBuild: true, skipPattern:'.*\\[skip ci\\].*')

                            // Get the build user
                            wrap([$class: 'BuildUser']) {
                                env.BUILDER = sh(script: '[[ -z "${BUILD_USER}" ]] && echo -n "$(git show -s --pretty=%ae)" || echo -n "${BUILD_USER}"', returnStdout: true).trim()
                            }

                            // env.SLACK_ID = getSlackid.forEmail "${env.BUILDER}"

                            sh 'rm -rf node_modules'
                            sh 'npm --userconfig .npmrc set email mcauk@catapult.cx'
                            withAWS(roleAccount: '009543623063', role: 'CrossAccount-Deployer', region: "${AWS_REGION}") {
                                sh 'npm run ca:setup'
                                env.OKTA_CLIENT_SECRET = credentials('dev/smart/okta_client_secret')
                                env.OKTA_ACCESS_API_TOKEN = credentials('dev/smart/okta-api-token')
                                env.LOCAL_AUTH_JWT_KEY = credentials('dev/smart/local_auth_jwt_key')
                                env.OKTA_SCOPE_AB = sh(script: '''aws ssm get-parameters --names "/dev/scopes/ab" --query "Parameters[].Value" --output text''', returnStdout: true).trim()
                                env.OKTA_SCOPE_TP = sh(script: '''aws ssm get-parameters --names "/dev/scopes/tp" --query "Parameters[].Value" --output text''', returnStdout: true).trim()
                            }

                            sh 'npm cache clean --force'
                            sh 'rm -rf node_modules package-lock.json'
                            sh 'npm install'
                            //sh 'npm ci'

                            // Get next version
                            env.PACKAGE_NAME = sh(script: 'node -p "require(\'./package.json\').name"', returnStdout: true).trim()
                            env.BASE_VERSION = sh(script: 'node -p -e "require(\'./package.json\').version" | grep -o \'^[0-9]*\\.[0-9]*\'', returnStdout: true).trim()
                            env.LATEST_VERSION = sh(script: 'npm view $(node -p "require(\'./package.json\').name")@"~${BASE_VERSION}" version --json | grep \'"\' | cut -d \'"\' -f 2 | sort --version-sort --reverse | head -n 1', returnStdout: true).trim()
                            env.NEXT_VERSION = sh(script: '[[ -z "$LATEST_VERSION" ]] && echo "${BASE_VERSION}.0" || semver -i patch $LATEST_VERSION', returnStdout: true).trim()
                            env.DOCKER_IMAGE_NAME = sh(script: 'node -p "require(\'./package.json\').name" | cut -d "/" -f 2', returnStdout: true).trim()

                            buildName "${NEXT_VERSION}"
                        }
                    }
                }
                stage('test') {
                    environment{
                        COMPOSE_PROFILES = 'default,api'
                    }
                    steps {
                        withCredentials([aws(credentialsId: "${AWS_CREDENTIALS_ID}", accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                            sh 'pwd'
                            sh 'gulp'
                            sh 'docker compose pull'
                            sh 'docker compose up -d'
                            // Make sure the API has finished the migration and seed scripts
                            sh 'sleep 60s'
                            sh 'docker compose ps'
                            sh 'docker compose exec redis env'
                            sh 'npm test'
                        }
                    }
                    post {
                        always {
                            withCredentials([aws(credentialsId: "${AWS_CREDENTIALS_ID}", accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                                sh 'docker compose logs --no-color > docker-test-logs.txt'
                                archiveArtifacts artifacts: 'docker-test-logs.txt', allowEmptyArchive: true
                                sh 'docker compose down || true'
                            }
                        }
                    }
                }

                stage('ui test') {
                    steps {
                        withCredentials([aws(credentialsId: "${AWS_CREDENTIALS_ID}", accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                            script {
                                env.COMPOSE_PROFILES = 'full'
                                sh 'gulp'
                                sh 'docker compose build'
                                sh 'docker compose up -d'
                                // Make sure the API has finished the migration and seed scripts
                                sh 'sleep 20s'
                                sh 'npm run test:wdio-headless'
                            }
                        }
                    }
                    post {
                        always {
                            sh 'docker compose logs smart-ui --no-color > docker-ui-test-ui-logs.txt'
                            sh 'docker compose logs smart-api --no-color > docker-ui-test-api-logs.txt'
                            sh 'docker compose logs smart-comments-api --no-color > docker-ui-test-comments-logs.txt'
                            sh 'docker compose logs nginx --no-color > docker-ui-test-nginx-logs.txt'
                            archiveArtifacts artifacts: 'docker-ui-test-ui-logs.txt, docker-ui-test-api-logs.txt, docker-ui-test-comments-logs.txt, docker-ui-test-nginx-logs.txt', allowEmptyArchive: true
                            sh 'docker compose down || true'
                            // step([$class: 'CoberturaPublisher', coberturaReportFile: 'reports/cobertura-coverage.xml'])
                        }
                    }
               }

                stage('npm publish') {
                   when {
                       anyOf{
                            branch 'master'
                            expression { params.PUSH_TEST_CONTAINER}
                       }
                   }
                    steps {
                        script {
                           sh 'npm --no-git-tag-version --allow-same-version version ${NEXT_VERSION}'
                           sh 'pwd'
                           sh 'npm publish'
//                            sshagent(credentials: ['github-ssh']) {
//                                 sh '''
//                                     git tag -a v${NEXT_VERSION} -m "release ${NEXT_VERSION} || true"
//                                     git push git@github.com:mcagov/smart-ui.git "v${NEXT_VERSION}"
//                                 '''
//                            }
//                            sh 'git tag -a v${NEXT_VERSION} -m "release ${NEXT_VERSION}"'
//                            sh 'git push origin v${NEXT_VERSION}'
                        }
                    }
                }

                stage('docker-publish') {
                    when {
                        anyOf{
                        branch 'master'
                        expression { params.PUSH_TEST_CONTAINER}
                        }
                    }
                    steps {
                        script {
                        def imageTag = (env.BRANCH_NAME == 'master') ? "${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${NEXT_VERSION}" : "${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}-TEST"
                            sh '''
                            echo "Building docker image ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${NEXT_VERSION}"

                            docker build ${DOCKER_OPTS} \
                                -t "${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${NEXT_VERSION}" \
                                --secret id=npmrc,src=.npmrc \
                                --build-arg UI_VERSION=$NEXT_VERSION \
                                .

                            docker push "${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${NEXT_VERSION}"
                            '''
                        }
                    }
                }

                stage('vulnerability-report') {
                   when { branch 'master' }
                    steps {
                        withCredentials([aws(credentialsId: "${AWS_CREDENTIALS_ID}", accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                            script {
                                String describeImageJson = sh(label: 'Retrieve Image Digest', script: "aws ecr describe-images --repository-name ${DOCKER_IMAGE_NAME} --image-id imageTag=${NEXT_VERSION} --region ${AWS_REGION} --output json", returnStdout: true)
                                def imageInfo = readJSON text: describeImageJson
                                def imageDigest = imageInfo.imageDetails[0].imageDigest
                                println("Waiting for the image scan to kick start ...")
                                sh 'sleep 60'

                                boolean isComplete = false
                                while (!isComplete) {
                                    String scanJson = sh(
                                        label: 'Check ECR Scan Status',
                                        script: "aws ecr describe-image-scan-findings --repository-name ${DOCKER_IMAGE_NAME} --image-id imageDigest=${imageDigest} --region ${AWS_REGION} --output json",
                                        returnStdout: true
                                    )

                                    def scanData = readJSON text: scanJson
                                    def scanStatus = scanData.imageScanStatus.status

                                    if (scanStatus == 'COMPLETE') {
                                        isComplete = true
                                        def findings = scanData.imageScanFindings.findingSeverityCounts
                                        println("Scan Findings Summary: ${findings}")

                                        env.VULNERABILITIES = findings.toString()
                                        writeFile file: 'vulnerabilities.log', text: env.VULNERABILITIES
                                        archiveArtifacts artifacts: 'vulnerabilities.log'
                                    } else if (scanStatus == 'FAILED') {
                                        error "ECR Image Scan failed for ${DOCKER_IMAGE_NAME}"
                                    } else {
                                        println("Current Status: ${scanStatus}. Waiting 30s...")
                                        sleep 30
                                    }
                                }
                            }
                        }
                    }
               } //end of vulnerabilityReport
            }
        }
    } // end of stages

    post {
        always {
            script{

                def build_status = env.BUILD_STATUS

                sh """
                echo $build_status
                """

                if (build_status == 'FAILURE') {
                    slackSend color: 'danger', message: "Deployment failed: ${env.BUILD_URL}"
                } else {
                    slackSend color: 'good', message: "Deployment successful: ${env.BUILD_URL}"
                }
            }
        }
    }

    // post {
    //     always {
    //         jiraSendBuildInfo site: 'mcauk.atlassian.net'
    //         cleanWs(cleanWhenNotBuilt: true,
    //             deleteDirs: true,
    //             patterns: [
    //                 [pattern: '~/.docker', type: 'INCLUDE'],
    //                 [pattern: '~/.netrc', type: 'INCLUDE'],
    //                 [pattern: '.npmrc', type: 'INCLUDE']])
    //         junit allowEmptyResults: true, skipPublishingChecks: true, testResults: '**/reports/*-junit.xml'
    //         junit allowEmptyResults: true, skipPublishingChecks: true, testResults: 'wdio-output/*.xml'
    //     }
    //     failure {
    //         slackSend(color: '#FF0000', message: '', attachments: [
    //             [
    //                 text:   '<@' + env.SLACK_ID + '>\n' +
    //                         ' A build you (' + env.BUILDER + ') started has failed\n' +
    //                         '<' + env.BUILD_URL + '|' +
    //                         env.JOB_NAME.replaceAll('/', ' » ') +
    //                         ' #' + env.BUILD_NUMBER + '>\n',
    //                 color: '#FF0000'
    //             ]
    //         ])
    //         emailext(
    //             subject: "[JENKINS MCAUK] FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
    //             body: """<p>FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]':</p>
    //                     <p>Check console output at &QUOT;<a href='${env.BUILD_URL}'>${env.JOB_NAME} [${env.BUILD_NUMBER}]</a>&QUOT;</p>""",
    //             to: 'mcauk@catapult.cx',
    //             mimeType: 'text/html',
    //             recipientProviders: [[$class: 'DevelopersRecipientProvider'], [$class: 'RequesterRecipientProvider'], [$class: 'CulpritsRecipientProvider']]
    //         )
    //     }
    // }
} //end of pipeline
