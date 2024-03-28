# Create domain and cert for .local

provider "acme" {
  server_url = "https://acme-v02.api.letsencrypt.org/directory"
}

locals {
  docker_bridge_ip          = "172.17.0.1"
  local_sub_domain          = "local.smart.mcga.uk"
  local_fqdn                = "service.${local.local_sub_domain}"
  local_name_prefix         = "${var.organisation}-${var.project}-local"
  local_aws_fqdn            = "aws.${local.local_sub_domain}"
  local_attachements_bucket = "mcauk-smart-dev-attachments.${local.local_aws_fqdn}"
  local_staging_bucket      = "mcauk-smart-dev-staging-attachments.${local.local_aws_fqdn}"
  local_id_fqdn             = "id.${local.local_sub_domain}"
  local_users_fqdn          = "users.${local.local_sub_domain}"
}

module "secret_cloudflare_mcauk_token" {
  source = "github.com/catapultcx/module-aws-secret-lookup"
  name   = "cloudflare/mcauk/api_key"
}

module "secret_cloudflare_mcauk_zone_id" {
  source = "github.com/catapultcx/module-aws-secret-lookup"
  name   = "cloudflare/mcauk/zone_id"
}

provider "cloudflare" {
  api_token = module.secret_cloudflare_mcauk_token.value
}

resource "aws_route53_zone" "local_subdomain" {
  count = terraform.workspace == "dev" ? 1 : 0
  name  = local.local_sub_domain
  tags = merge(
    local.common_tags, {
      Name = "${local.local_name_prefix}-r53-local-subdomain"
    }
  )
}

resource "cloudflare_record" "ns_record" {
  count   = terraform.workspace == "dev" ? length(aws_route53_zone.local_subdomain[0].name_servers) : 0
  zone_id = module.secret_cloudflare_mcauk_zone_id.value
  name    = "local.smart"
  value   = aws_route53_zone.local_subdomain[0].name_servers[count.index]
  type    = "NS"
}

resource "aws_route53_record" "local_ui" {
  count   = terraform.workspace == "dev" ? 1 : 0
  zone_id = aws_route53_zone.local_subdomain[0].zone_id
  name    = local.local_fqdn
  type    = "A"
  ttl     = "300"
  records = [local.docker_bridge_ip]
}

# DNS for localstack
resource "aws_route53_record" "local_aws" {
  count   = terraform.workspace == "dev" ? 1 : 0
  zone_id = aws_route53_zone.local_subdomain[0].zone_id
  name    = local.local_aws_fqdn
  type    = "A"
  ttl     = "300"
  records = [local.docker_bridge_ip]
}

resource "aws_route53_record" "local_private_bucket" {
  count   = terraform.workspace == "dev" ? 1 : 0
  zone_id = aws_route53_zone.local_subdomain[0].zone_id
  name    = local.local_attachements_bucket
  type    = "A"
  ttl     = "300"
  records = [local.docker_bridge_ip]
}

resource "aws_route53_record" "local_staging_bucket" {
  count   = terraform.workspace == "dev" ? 1 : 0
  zone_id = aws_route53_zone.local_subdomain[0].zone_id
  name    = local.local_staging_bucket
  type    = "A"
  ttl     = "300"
  records = [local.docker_bridge_ip]
}

resource "aws_route53_record" "local_id" {
  count   = terraform.workspace == "dev" ? 1 : 0
  zone_id = aws_route53_zone.local_subdomain[0].zone_id
  name    = local.local_id_fqdn
  type    = "A"
  ttl     = "300"
  records = [local.docker_bridge_ip]
}

resource "aws_route53_record" "local_caa" {
  count           = terraform.workspace == "dev" ? 1 : 0
  allow_overwrite = true
  name            = local.local_fqdn
  records = [
    "0 issue \"amazon.com\"",
    "0 issuewild \"amazon.com\"",
    "0 issue \"letsencrypt.org\"",
    "0 issuewild \"letsencrypt.org\""
  ]
  type    = "CAA"
  ttl     = 600
  zone_id = aws_route53_zone.local_subdomain[0].id
}

resource "tls_private_key" "local_reg_private_key" {
  count     = terraform.workspace == "dev" ? 1 : 0
  algorithm = "RSA"
}

resource "acme_registration" "local_reg" {
  count           = terraform.workspace == "dev" ? 1 : 0
  account_key_pem = tls_private_key.local_reg_private_key[0].private_key_pem
  email_address   = "mcauk@catapult.cx"
  depends_on = [
    aws_route53_record.local_caa
  ]
}

resource "tls_private_key" "local_cert_private_key" {
  count     = terraform.workspace == "dev" ? 1 : 0
  algorithm = "RSA"
}

resource "acme_certificate" "local_certificate" {
  count           = terraform.workspace == "dev" ? 1 : 0
  account_key_pem = acme_registration.local_reg[0].account_key_pem
  common_name     = local.local_fqdn
  subject_alternative_names = [
    local.local_users_fqdn,
    aws_route53_record.local_private_bucket[0].fqdn,
    aws_route53_record.local_staging_bucket[0].fqdn,
    aws_route53_record.local_aws[0].fqdn,
    aws_route53_record.local_id[0].fqdn

  ]
  disable_complete_propagation = true

  dns_challenge {
    provider = "route53"
    config = {
      AWS_HOSTED_ZONE_ID = aws_route53_zone.local_subdomain[0].id
      AWS_REGION         = data.aws_region.current.id
      AWS_DEFAULT_REGION = data.aws_region.current.id
    }
  }
}

resource "aws_ssm_parameter" "local_cert_issuer_pem" {
  count     = terraform.workspace == "dev" ? 1 : 0
  name      = "/local/tls/issuer"
  value     = acme_certificate.local_certificate[0].issuer_pem
  type      = "String"
  overwrite = true
}

resource "aws_ssm_parameter" "local_cert_cert_pem" {
  count     = terraform.workspace == "dev" ? 1 : 0
  name      = "/local/tls/cert"
  value     = acme_certificate.local_certificate[0].certificate_pem
  type      = "String"
  overwrite = true
}

resource "aws_ssm_parameter" "local_cert_fullchain_pem" {
  count     = terraform.workspace == "dev" ? 1 : 0
  name      = "/local/tls/fullchain"
  value     = "${acme_certificate.local_certificate[0].certificate_pem}${acme_certificate.local_certificate[0].issuer_pem}"
  type      = "String"
  tier      = "Advanced"
  overwrite = true
}

resource "aws_ssm_parameter" "local_cert_key_pem" {
  count     = terraform.workspace == "dev" ? 1 : 0
  name      = "/local/tls/key"
  value     = acme_certificate.local_certificate[0].private_key_pem
  type      = "String"
  overwrite = true
}
