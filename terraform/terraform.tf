locals {
  environment          = terraform.workspace
  name_prefix          = "${var.organisation}-${var.project}-${local.environment}"
  vpc_name             = "${local.name_prefix}-vpc"
  cluster_name         = "${local.name_prefix}-eks"
  replication_group_id = "${local.name_prefix}-ui-session-cache"
  ecr_repo_url         = "009543623063.dkr.ecr.eu-west-2.amazonaws.com"
  common_tags = {
    Organisation = var.organisation
    Project      = var.project
    Environment  = local.environment
  }
}

module "smart_ui" {
  source          = "github.com/mcagov/module-k8-deployment"
  name            = var.service_name
  image           = "${local.ecr_repo_url}/${var.service_name}:${var.smart_ui_version}"
  replicas        = var.replicas[terraform.workspace]
  requests_cpu    = var.requests_cpu[terraform.workspace]
  requests_memory = var.requests_memory[terraform.workspace]
  limits_cpu      = var.limits_cpu[terraform.workspace]
  limits_memory   = var.limits_memory[terraform.workspace]

  startup_probe = {
    http_get = {
      path   = "/health"
      port   = var.port
      scheme = "HTTP"
    }
  }

  readiness_probe = {
    http_get = {
      path   = "/health"
      port   = var.port
      scheme = "HTTP"
    }
  }

  liveness_probe = {
    http_get = {
      path   = "/health"
      port   = var.port
      scheme = "HTTP"
    }
    initial_delay_seconds = 30
  }

  pre_stop_exe                     = ["/bin/sh", "-c", "sleep 40"]
  termination_grace_period_seconds = 70

  ports = {
    "${var.service_name}" = var.port,
  }

  environment_variables = {
    APP_BASE_URL             = nonsensitive("https://${data.aws_ssm_parameter.public_fqdn.value}")
    ATLAS_TOKEN              = data.aws_secretsmanager_secret_version.atlas_token.secret_string
    ATLAS_URL                = "https://mcauk.atlassian.net"
    ATLAS_USER               = nonsensitive(data.aws_secretsmanager_secret_version.atlas_user.secret_string)
    ATTACHMENTS_API          = "http://smart-attachments:3000"
    AWS_REGION               = data.aws_region.current.name
    AWS_XRAY_CONTEXT_MSSING  = "LOG_ERROR"
    AWS_XRAY_DAEMON_ADDRESS  = "xray-daemon:2000"
    AWS_XRAY_LOG_LEVEL       = "silent"
    COMMENTS_API             = "http://smart-comments:3000"
    ENABLE_PRETTY_ERRORS     = "false"
    ENABLE_REDIS             = "true"
    ENABLE_FORECAST_WORKFLOW = var.enable_forecast_workflow[terraform.workspace]
    GOOGLE_ID                = nonsensitive(data.aws_ssm_parameter.google_id.value)
    HOST                     = nonsensitive("https://${data.aws_ssm_parameter.public_fqdn.value}")
    LOCAL_AUTH               = "false"
    LOGGER_MORGAN_SKIP       = var.log_filter[terraform.workspace]
    NODE_ENV                 = local.environment
    NODE_OPTIONS             = "--experimental-vm-modules --experimental-specifier-resolution=node"
    OKTA_AUD                 = "api://${local.name_prefix}"
    OKTA_AZURE_IDP           = nonsensitive(data.aws_secretsmanager_secret_version.okta_azure_idp.secret_string)
    OKTA_CLIENT_ID           = nonsensitive(data.aws_secretsmanager_secret_version.okta_client_id.secret_string)
    OKTA_ISSUER_URL          = nonsensitive(data.aws_secretsmanager_secret_version.okta_issuer.secret_string)
    OKTA_ORG_URL             = nonsensitive(data.aws_secretsmanager_secret_version.okta_org_url.secret_string)
    OKTA_REDIRECT_URI        = nonsensitive("https://${data.aws_ssm_parameter.public_fqdn.value}/authorization-code/callback")
    OKTA_SCOPE               = "openid profile offline_access"
    OKTA_SCOPE               = "openid"
    OKTA_SCOPE_AB            = nonsensitive(data.aws_ssm_parameter.ab_scopes.value)
    OKTA_SCOPE_TP            = nonsensitive(data.aws_ssm_parameter.tp_scopes.value)
    OKTA_SMART_USER_TYPE_ID  = nonsensitive(data.aws_ssm_parameter.okta_smart_user_id.value)
    PORT                     = var.port
    REDIS_HOST               = data.aws_elasticache_replication_group.redis_cache.primary_endpoint_address
    REDIS_PORT               = data.aws_elasticache_replication_group.redis_cache.port
    REDIS_TLS                = "true"
    SMART_API                = "http://smart-api:3000"
    ENABLE_SIGNIN_WITH_AZURE = "true"
  }

  environment_secrets = [
    {
      "name" : "SESSION_SECRET",
      "key" : module.session_secret.name
      "secret" : module.session_secret.name
    },
    {
      "name" : "OKTA_CLIENT_SECRET",
      "key" : module.okta_client_secret.name
      "secret" : module.okta_client_secret.name
    },
    {
      "name" : "OKTA_ACCESS_API_TOKEN",
      "key" : module.okta_api_token.name
      "secret" : module.okta_api_token.name
    },
    {
      "name" : "REDIS_PASSWORD",
      "key" : module.redis_password.name
      "secret" : module.redis_password.name
    }
  ]
}

resource "kubernetes_service" "smart_ui" {
  metadata {
    name      = var.service_name
    namespace = var.kube_namespace
    annotations = {
      "service.beta.kubernetes.io/aws-load-balancer-type"     = "nlb-ip"
      "service.beta.kubernetes.io/aws-load-balancer-internal" = "true"
    }

  }
  spec {
    load_balancer_class = "service.k8s.aws/nlb"
    selector = {
      App = var.service_name
    }
    port {
      port = var.port
    }
    type = "LoadBalancer"
  }
}

resource "kubernetes_manifest" "smart_ui_tgb" {
  manifest = {
    apiVersion = "elbv2.k8s.aws/v1beta1"
    kind       = "TargetGroupBinding"
    metadata = {
      name      = module.smart_ui.name
      namespace = module.smart_ui.namespace
    }
    spec = {
      serviceRef = {
        name = module.smart_ui.name
        port = var.port
      }
      targetGroupARN = data.aws_lb_target_group.smart_ui_eks.arn
      targetType     = "ip"
    }
  }
}

