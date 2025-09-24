module "okta_api_token" {
  source           = "github.com/mcagov/module-external-secrets-v2.git"
  aws_secret_name  = "${local.environment}/${var.project}/okta-api-token"
  kube_secret_name = "smart-ui-okta-access-api-token"
  cluster_name     = local.cluster_name
}

module "okta_client_secret" {
  source           = "github.com/mcagov/module-external-secrets-v2.git"
  aws_secret_name  = "${local.environment}/${var.project}/okta_client_secret"
  kube_secret_name = "smart-ui-okta-client-secret"
  cluster_name     = local.cluster_name
}

module "session_secret" {
  source           = "github.com/mcagov/module-external-secrets-v2.git"
  aws_secret_name  = "${local.environment}/${var.project}/sessionsecret"
  kube_secret_name = "smart-ui-session-secret"
  cluster_name     = local.cluster_name
}

module "redis_password" {
  source           = "github.com/mcagov/module-external-secrets-v2.git"
  aws_secret_name  = "${local.environment}/redis/password"
  kube_secret_name = "uksr-ui-redis-password"
  cluster_name     = local.cluster_name
}
