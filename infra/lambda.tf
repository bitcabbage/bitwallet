//_                 _         _
//| | __ _ _ __ ___ | |__   __| | __ _
//| |/ _` | '_ ` _ \| '_ \ / _` |/ _` |
//| | (_| | | | | | | |_) | (_| | (_| |
//|_|\__,_|_| |_| |_|_.__/ \__,_|\__,_|
//

variable lambda_zip {
  default = "../dist/lambda.zip"
}

resource "aws_iam_role" "lambda_executor" {
  name = "LambdaExecutor"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": ["sts:AssumeRole"],
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "lambda_executor_policy" {
  name = "LambdaExecutorPolicy"
  role = "${aws_iam_role.lambda_executor.id}"
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ],
      "Resource": [
        "arn:aws:logs:*:*:*"
      ]
    }
  ]
}
EOF
}

resource "aws_security_group" "lambda_executor" {
  vpc_id = "${aws_vpc.production.id}"

  ingress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = [
      "0.0.0.0/0"
    ]
  }

  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = [
      "0.0.0.0/0"
    ]
  }
}

resource "aws_lambda_function" "bitwallet" {
  filename = "${var.lambda_zip}"
  description = "Bitwallet"
  function_name = "bitwallet"
  runtime = "nodejs4.3"
  memory_size = 512
  timeout = 20
  role = "${aws_iam_role.lambda_executor.arn}"
  handler = "lambda.handler"
  source_code_hash = "${base64sha256(file(var.lambda_zip))}"
  vpc_config = {
    subnet_ids = [
      "${aws_subnet.private.*.id}"
    ]
    security_group_ids = [
      "${aws_security_group.lambda_executor.id}"
    ]
  }
}