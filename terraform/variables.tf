variable "organisation" {
  default = "mcauk"
}

variable "project" {
  default = "smart"
}

variable "aws_region" {
  default = "eu-west-2"
}

variable "tags" {
  description = "Custom tags to apply to all resources."
  type        = map(string)
  default     = {}
}

variable "replicas" {
  default = {
    dev     = 1
    preprod = 1
    live    = 2
  }
}

variable "smart_ui_version" {
  type = string
}

variable "service_name" {
  default = "smart-ui"
}

variable "kube_namespace" {
  default = "default"
}

variable "port" {
  default = 3000
}

variable "requests_cpu" {
  default = {
    dev     = "1"
    preprod = "1"
    live    = "1"
  }
}

variable "requests_memory" {
  default = {
    dev     = "512Mi"
    preprod = "512Mi"
    live    = "512Mi"
  }
}

variable "limits_cpu" {
  default = {
    dev     = "1"
    preprod = "1"
    live    = "1"
  }
}

variable "limits_memory" {
  default = {
    dev     = "1Gi"
    preprod = "1Gi"
    live    = "1Gi"
  }
}

variable "log_filter" {
  default = {
    dev     = "/public/,/assets/,/health"
    preprod = "/public/,/assets/,/health"
    live    = "/public/,/assets/,/health"
  }
}

variable "enable_forecast_workflow" {
  default = {
    dev     = true
    preprod = true
    live    = true
  }
}
