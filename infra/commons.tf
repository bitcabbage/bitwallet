terraform {
  backend "s3" {
    bucket = "terracabbage"
    key    = "state/bitwallet"
    region = "us-west-2"
  }
}

provider "aws" {
  region = "${var.region}"
}

variable "region" {
  default = "us-west-2"
}

variable "availabilityZones" {
  type = "list"
  default = [
    "us-west-2a",
    "us-west-2b"
  ]
}