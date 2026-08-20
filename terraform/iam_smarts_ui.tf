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


locals{
  is_dev = terraform.workspace == "dev" ? 1 : 0
}

resource "aws_iam_openid_connect_provider" "github" {
  count = local.is_dev

  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c3d42428b8129febd9b2313380d0d29759325f1",
    "22ff89586561fc2d52f77491e9f1eff1b80be33e"
  ]
}

data "aws_iam_policy_document" "github_actions_assume_role" {
  count = local.is_dev

  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github[0].arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_org}/${var.github_repo}:*"]
    }
  }
}

resource "aws_iam_role" "github_actions_codeartifact" {
  count = local.is_dev

  name               = "${var.github_repo}-github-actions-role"
  description        = "Role assumed by GitHub Actions for CodeArtifact authentication on ${var.github_repo}"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role[0].json
}

data "aws_iam_policy_document" "codeartifact_read_only" {
  count = local.is_dev

  statement {
    sid       = "ECRAuthToken"
    effect    = "Allow"
    actions   = [
      "ecr:GetAuthorizationToken",
      "ecr-public:GetAuthorizationToken"
    ]
    resources = ["*"]
  }

  statement {
    sid       = "STSGetServiceBearerToken"
    effect    = "Allow"
    actions   = ["sts:GetServiceBearerToken"]
    resources = ["*"]
  }

  statement {
    sid    = "ECRRepositoryWriteAndScan"
    effect = "Allow"
    actions = [
      # Read permissions
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",

      # Write Permissions
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:PutImage",

      # Metadata and security
      "ecr:DescribeImages",
      "ecr:DescribeImageScanFindings"
    ]
    resources = [
      "arn:aws:ecr:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:repository/*"
    ]
  }

  statement {
    sid    = "CodeArtifactAccess"
    effect = "Allow"
    actions = [
      "codeartifact:GetAuthorizationToken",
      "codeartifact:GetRepositoryEndpoint",
      "codeartifact:ReadFromRepository"
    ]
    resources = [
      "arn:aws:codeartifact:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:domain/mcga",
      "arn:aws:codeartifact:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:repository/mcga/*"
    ]
  }

  statement {
    sid    = "AllowCodeArtifactPublish"
    effect = "Allow"
    actions = [
      "codeartifact:PublishPackageVersion",
      "codeartifact:PutPackageMetadata",
    ]
    resources = [
      "arn:aws:codeartifact:eu-west-2:${data.aws_caller_identity.current.account_id}:package/mcga/mcga-npm/npm/@mca/smart-ui",
      "arn:aws:codeartifact:eu-west-2:${data.aws_caller_identity.current.account_id}:package/mcga/mcga-npm/npm/@mca/smart-ui/*",
    ]
  }
  

  statement {
    sid    = "SSMGetScopes"
    effect = "Allow"
    actions = [
      "ssm:GetParameters",
      "ssm:GetParameter"
    ]
    resources = [
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/dev/scopes/*"
    ]
  }
}

resource "aws_iam_policy" "codeartifact_policy" {
  count = local.is_dev

  name        = "${var.github_repo}-codeartifact-read-policy"
  description = "Provides read access to CodeArtifact for GitHub Actions"
  policy      = data.aws_iam_policy_document.codeartifact_read_only[0].json
}

resource "aws_iam_role_policy_attachment" "attach_codeartifact" {
  count = local.is_dev

  role       = aws_iam_role.github_actions_codeartifact[0].name
  policy_arn = aws_iam_policy.codeartifact_policy[0].arn
}

//module "smarts_ui_role" {
//  source               = "github.com/mcga-gov-uk/module-iam-service-role.git"
//  name_prefix          = "${local.name_prefix}-sa"
//  oidc_arn             = data.aws_ssm_parameter.oidc_arn_ssm.value
//  cluster_url          = data.aws_ssm_parameter.oidc_url_ssm.value
//  service_account_name = "smarts_ui"
//  policy_json          = data.aws_iam_policy_document.smarts_ui_policy_doc.json
//}
