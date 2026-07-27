data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

data "aws_vpc" "vpc" {
  tags = {
    Name = local.vpc_name
  }
}

data "aws_eks_cluster" "cluster" {
  name = local.cluster_name
}

data "aws_eks_cluster_auth" "cluster" {
  name = local.cluster_name
}

data "aws_secretsmanager_secret" "atlas_user" {
  name = "atlas/atlas_user"
}

data "aws_secretsmanager_secret_version" "atlas_user" {
  secret_id = data.aws_secretsmanager_secret.atlas_user.id
}

data "aws_secretsmanager_secret" "atlas_token" {
  name = "atlas/atlas_token"
}

data "aws_secretsmanager_secret_version" "atlas_token" {
  secret_id = data.aws_secretsmanager_secret.atlas_token.id
}

data "aws_lb_target_group" "smart_ui_eks" {
  name = "${local.name_prefix}-smart-ui-eks"
}

data "aws_ssm_parameter" "public_fqdn" {
  name = "/${local.environment}/fqdn/public"
}


data "aws_secretsmanager_secret" "okta_client_id" {
  name = "${local.environment}/${var.project}/okta_client_id"
}

data "aws_secretsmanager_secret_version" "okta_client_id" {
  secret_id = data.aws_secretsmanager_secret.okta_client_id.id
}

data "aws_secretsmanager_secret" "okta_issuer" {
  name = "${local.environment}/${var.project}/okta_issuer"
}

data "aws_secretsmanager_secret_version" "okta_issuer" {
  secret_id = data.aws_secretsmanager_secret.okta_issuer.id
}

data "aws_secretsmanager_secret" "okta_org_url" {
  name = "${local.environment}/${var.project}/okta_org_url"
}

data "aws_secretsmanager_secret_version" "okta_org_url" {
  secret_id = data.aws_secretsmanager_secret.okta_org_url.id
}

data "aws_secretsmanager_secret" "okta_azure_idp" {
  name = "${local.environment}/${var.project}/okta_azure_idp"
}

data "aws_secretsmanager_secret_version" "okta_azure_idp" {
  secret_id = data.aws_secretsmanager_secret.okta_azure_idp.id
}

data "aws_ssm_parameter" "google_id" {
  name = "/${local.environment}/smart-ui/google-id"
}

data "aws_elasticache_replication_group" "redis_cache" {
  replication_group_id = local.replication_group_id
}

data "aws_ssm_parameter" "ab_scopes" {
  name = "/${local.environment}/scopes/ab"
}

data "aws_ssm_parameter" "tp_scopes" {
  name = "/${local.environment}/scopes/tp"
}

data "aws_ssm_parameter" "okta_smart_user_id" {
  name = "/${local.environment}/okta/smart/user-id"
}
