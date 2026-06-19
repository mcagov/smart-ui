data "aws_iam_policy_document" "smart_ui_policy_doc" {
  statement {
    actions = [
      "s3:ListAllMyBuckets",
    ]
    resources = [
      "arn:aws:s3:::*"
    ]
  }
}

//module "smarts_ui_role" {
//  source               = "github.com/mcga-gov-uk/module-iam-service-role.git"
//  name_prefix          = "${local.name_prefix}-sa"
//  oidc_arn             = data.aws_ssm_parameter.oidc_arn_ssm.value
//  cluster_url          = data.aws_ssm_parameter.oidc_url_ssm.value
//  service_account_name = "smarts_ui"
//  policy_json          = data.aws_iam_policy_document.smarts_ui_policy_doc.json
//}
