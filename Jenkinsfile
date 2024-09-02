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
        DOCKER_OPTS = '--pull --compress --no-cache=true --force-rm=true --progress=plain '
        DOCKER_BUILDKIT = '1'

        ENABLE_XRAY = false
        AWS_XRAY_CONTEXT_MISSING = 'LOG_ERROR'
        AWS_XRAY_LOG_LEVEL = 'silent'
        AWS_REGION = 'eu-west-2'
        AWS_PRIVATE_BUCKET = 'mcauk-smart-dev-attachments'

        APP_BASE_URL = 'http://service.local.smart.mcga.uk'
        LOCAL_AUTH = 'true'
        SESSION_SECRET = '34b9b922-114c-4cc8-b5f9-b029ebe86f59'

        OKTA_ORG_URL = 'https://id.mca.dev.catapult.cx'
        OKTA_AUD = 'api://mcauk-smart-dev'
        OKTA_SCOPE = 'openid profile offline_access'
        OKTA_REDIRECT_URI = 'https://service.local.smart.mcga.uk/authorization-code/callback'
        OKTA_ISSUER_URL = 'https://id.mca.dev.catapult.cx/oauth2/aush2o6wpn3IG2U6o357'
        OKTA_CLIENT_ID = '0oah2o9o51KkYDlGJ357'

        ENABLE_REDIS = 'true'
        REDIS_PASSWORD = 'V*.L=pL9B[kwM8d+'
        REDIS_HOST = 'service.local.smart.mcga.uk'
        REDIS_TLS = 'true'
        REDIS_PORT = '6379'

        CUCUMBER_PUBLISH_ENABLED = 'false'
        API_SPRING_PROFILES = 'default, dev, test,local-auth'
        JAVA_ENV='local'

        NODE_OPTIONS="--experimental-vm-modules --experimental-specifier-resolution=node"
        AWS_CREDENTIALS_ID = 'aws-jenkins-service-account-credentials' // ID for AWS credentials in Jenkins
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
        stage('setup') {
            agent {
                docker {
                                image '009543623063.dkr.ecr.eu-west-2.amazonaws.com/jenkins-npm-ci:latest'
                    alwaysPull true
                    args '-v /var/run/docker.sock:/var/run/docker.sock -v /var/lib/jenkins/.npm:/home/jenkins/.npm'
                }
            }
            steps {
                script {
                    scmSkip(deleteBuild: true, skipPattern:'.*\\[skip ci\\].*')

                    // Get the build user
                    wrap([$class: 'BuildUser']) {
                        env.BUILDER = sh (script:'[[ -z "${BUILD_USER}" ]] && echo -n "$(git show -s --pretty=%ae)" || echo -n "${BUILD_USER}"', returnStdout: true).trim()
                    }

                    // env.SLACK_ID = getSlackid.forEmail "${env.BUILDER}"

                    sh 'rm -rf node_modules'
                    sh 'npm --userconfig .npmrc set email mcauk@catapult.cx'
                    withAWS(roleAccount:'009543623063', role:'CrossAccount-Deployer', region: "${AWS_REGION}") {
                        sh 'npm run ca:setup'
                        env.OKTA_CLIENT_SECRET = credentials('dev/smart/okta_client_secret')
                        env.OKTA_ACCESS_API_TOKEN = credentials('dev/smart/okta-api-token')
                        env.LOCAL_AUTH_JWT_KEY = credentials('dev/smart/local_auth_jwt_key')
                        env.OKTA_SCOPE_AB = sh(script:'''aws ssm get-parameters --names "/dev/scopes/ab" --query "Parameters[].Value" --output text''', returnStdout: true).trim()
                        env.OKTA_SCOPE_TP = sh(script:'''aws ssm get-parameters --names "/dev/scopes/tp" --query "Parameters[].Value" --output text''', returnStdout: true).trim()
                    }

                        sh 'echo "Jenkins user running the job: $(whoami)"'

                        sh 'ls -alrt /home/jenkins'
                        sh 'ls -alrt /home/jenkins/.npm'

                        sh 'find /home/jenkins/ -user jenkins'

                    sh 'npm cache clean --force'
                    sh 'rm -rf node_modules package-lock.json'
                    sh 'npm install'
                    sh 'npm publish'
                    //sh 'npm ci'

                    // Get next version
                    env.PACKAGE_NAME = sh (script:'node -p "require(\'./package.json\').name"', returnStdout: true).trim()
                    env.BASE_VERSION = sh (script:'node -p -e "require(\'./package.json\').version"| grep -o \'^[0-9]*\\.[0-9]*\'', returnStdout: true).trim()
                    env.LATEST_VERSION = sh (script:'npm view $(node -p "require(\'./package.json\').name")@"~${BASE_VERSION}" version --json | grep \'"\' | cut -d \'"\' -f 2 | sort --version-sort --reverse| head -n 1', returnStdout: true).trim()
                    env.NEXT_VERSION = sh (script:'[[ -z "$LATEST_VERSION" ]] && echo "${BASE_VERSION}.0" || semver -i patch $LATEST_VERSION', returnStdout: true).trim()
                    env.DOCKER_IMAGE_NAME = sh (script:'node -p "require(\'./package.json\').name" | cut -d "/" -f 2 ', returnStdout: true).trim()
                    env.GIT_REPO = sh (script:'node -p -e "require(\'./package.json\').repository"', returnStdout: true).trim()

                buildName "${NEXT_VERSION}"

                }
            }
        }

//         stage('test') {
//             steps {
//                 script {
//                     env.COMPOSE_PROFILES = 'default,api'
//                     sh 'docker-compose pull'
//                     sh 'docker-compose up -d'
//                     // Make sure the API has finished the migration and seed scripts
//                     sh 'sleep 10s'
//                     sh 'docker-compose ps'
//                     sh 'gulp'
//                     sh 'npm test'
//                 }
//             }
//             post {
//                 always {
//                     sh 'docker-compose logs --no-color > docker-test-logs.txt'
//                     sh 'docker-compose down || true'
//                     // TODO fixme
//                     // recordCoverage(tools: [[parser: 'COBERTURA', pattern: 'reports/cobertura-coverage.xml' ]], id: 'cobertura', name: 'Cobertura Coverage', sourceCodeRetention: 'EVERY_BUILD',
//                     // qualityGates: [
//                     // [threshold: 60.0, metric: 'LINE', baseline: 'PROJECT', criticality: 'UNSTABLE'],
//                     // [threshold: 60.0, metric: 'BRANCH', baseline: 'PROJECT', criticality: 'UNSTABLE']])
//                 }
//             }
//         }

//         stage('ui test') {
//             steps {
//                 script {
//                     env.COMPOSE_PROFILES = 'full'
//                     sh 'gulp'
//                     sh 'docker-compose build'
//                     sh 'docker-compose up -d'
//                     // Make sure the API has finished the migration and seed scripts
//                     sh 'sleep 20s'
//                     sh 'docker-compose ps'
//                     sh 'npm run wdio-headless'
//                 }
//             }
//             post {
//                 always {
//                     sh 'docker-compose ps'
//                     sh 'docker-compose logs smart-ui --no-color > docker-ui-test-ui-logs.txt'
//                     sh 'docker-compose logs smart-api --no-color > docker-ui-test-api-logs.txt'
//                     sh 'docker-compose logs smart-comments-api --no-color > docker-ui-test-comments-logs.txt'
//                     sh 'docker-compose logs nginx --no-color > docker-ui-test-nginx-logs.txt'
//                     sh 'docker-compose down || true'
//                 // step([$class: 'CoberturaPublisher', coberturaReportFile: 'reports/cobertura-coverage.xml'])
//                 }
//             }
//         }

        stage('npm publish') {
            when { branch 'master' }
            steps {
                script {
                    sh 'npm --no-git-tag-version --allow-same-version version ${NEXT_VERSION}'
                    sh 'gulp buildInfo'

                    sh 'npm publish'
                    sh 'git tag -a v${NEXT_VERSION} -m "release ${NEXT_VERSION}"'
                    withCredentials([usernamePassword(credentialsId: 'mca-bot-gh', passwordVariable: 'GIT_PASSWORD', usernameVariable: 'GIT_USERNAME')]) {
                        sh 'git push https://${GIT_USERNAME}:${GIT_PASSWORD}@${GIT_REPO#*//}.git v${NEXT_VERSION}'
                    }
                }
            }
        }

        stage('docker-publish') {
            when { branch 'master' }
            steps {
                script {
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
                script {
                    String describeImageJson = sh(label: 'Retrieve Image Digest', script: "aws ecr describe-images --repository-name ${DOCKER_IMAGE_NAME} --image-id imageTag=${NEXT_VERSION} --region ${AWS_REGION} --output json", returnStdout: true) // Get image digest
                    def imageDigest = vulnerabilityReport.getImageDigest(describeImageJson);

                    println("Waiting for the image scan to kick start ...")
                    sh 'sleep 60' // Add some delay

                    def describeImageScanStatus = sh(label: 'Retrieve ECR Scan Findings', script: "aws ecr describe-image-scan-findings --repository-name ${DOCKER_IMAGE_NAME} --image-id imageTag=${NEXT_VERSION},imageDigest=${imageDigest} --region ${AWS_REGION} &>/dev/null", returnStatus: true)
                    if (describeImageScanStatus == 0) {
                        String describeImageScanJson = sh(label: 'Retrieve ECR Scan Findings', script: "aws ecr describe-image-scan-findings --repository-name ${DOCKER_IMAGE_NAME} --image-id imageTag=${NEXT_VERSION},imageDigest=${imageDigest} --region ${AWS_REGION} --output json ", returnStdout: true)
                        def scanStatus = vulnerabilityReport.getImageScanStatus(describeImageScanJson)
                        while (!scanStatus.equalsIgnoreCase("ACTIVE")) { // Wait until image scan status becomes ACTIVE
                            println("Waiting for image scan to complete...")
                            sh 'sleep 30' // Add some delay
                            describeImageScanJson = sh(label: 'Retrieve ECR Scan Findings', script: "aws ecr describe-image-scan-findings --repository-name ${DOCKER_IMAGE_NAME} --image-id imageTag=${NEXT_VERSION},imageDigest=${imageDigest} --region ${AWS_REGION} --output json", returnStdout: true)
                            scanStatus = vulnerabilityReport.getImageScanStatus(describeImageScanJson)
                        }
                        def findingResult = vulnerabilityReport.getVulnerabilityReport(describeImageScanJson)
                        println(findingResult)
                        env.VULNERABILITIES = findingResult
                        sh 'cat <<< "${VULNERABILITIES}" > vulnerabilities.log'
                        archiveArtifacts artifacts: 'vulnerabilities.log'
                    }
                }
            }
        }

        stage('deploy') {
            when { branch 'master' }
            steps {
                build (
                    job: 'Deploy/SMarT/smart-eks-deploys/smart-ui/master',
                    parameters: [
                        string(name: 'TF_WORKSPACE', value: 'dev'),
                        string(name: 'TF_VAR_smart_ui_version', value: "${env.DOCKER_IMAGE_NAME}:${env.NEXT_VERSION}")
                    ],
                    wait: true
                )
            }
            // post {
            //     always {
            //         jiraSendDeploymentInfo environmentId: 'dev', environmentName: 'smart-dev', environmentType: 'development'
            //     }
            // }
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
        }
