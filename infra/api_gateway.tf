//           _               _
//__ _ _ __ (_)   __ _  __ _| |_ _____      ____ _ _   _
/// _` | '_ \| |  / _` |/ _` | __/ _ \ \ /\ / / _` | | | |
//| (_| | |_) | | | (_| | (_| | ||  __/\ V  V / (_| | |_| |
//\__,_| .__/|_|  \__, |\__,_|\__\___| \_/\_/ \__,_|\__, |
//|_|        |___/                             |___/
//

resource "aws_iam_role" "api_executor" {
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Effect": "Allow",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      }
    },
    {
      "Action": "sts:AssumeRole",
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      }
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "bitwallet_api_executor_policy" {
  name = "bitwallet_api_executor_policy"
  role = "${aws_iam_role.api_executor.id}"
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
     {
        "Effect": "Allow",
        "Action": [
            "lambda:InvokeFunction"
        ],
        "Resource": ["${aws_lambda_function.bitwallet.arn}"]
    }
  ]
}
EOF
}

resource "aws_api_gateway_rest_api" "bitwallet" {
  name = "Bitwallet"
  description = "Bitwallet API"
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = "${aws_api_gateway_rest_api.bitwallet.id}"
  parent_id = "${aws_api_gateway_rest_api.bitwallet.root_resource_id}"
  path_part = "{proxy+}"
}

resource "aws_api_gateway_method" "any" {
  rest_api_id = "${aws_api_gateway_rest_api.bitwallet.id}"
  resource_id = "${aws_api_gateway_resource.proxy.id}"
  http_method = "ANY"
  authorization = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = "${aws_api_gateway_rest_api.bitwallet.id}"
  resource_id = "${aws_api_gateway_resource.proxy.id}"
  http_method = "${aws_api_gateway_method.any.http_method}"
  integration_http_method = "POST"
  type = "AWS_PROXY"
  uri = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.bitwallet.arn}/invocations"
  credentials = "${aws_iam_role.api_executor.arn}"
}

resource "aws_api_gateway_method" "cors" {
  rest_api_id = "${aws_api_gateway_rest_api.bitwallet.id}"
  resource_id = "${aws_api_gateway_resource.proxy.id}"
  http_method = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "cors" {
  rest_api_id = "${aws_api_gateway_rest_api.bitwallet.id}"
  resource_id = "${aws_api_gateway_resource.proxy.id}"
  http_method = "${aws_api_gateway_method.cors.http_method}"
  type = "MOCK"
  credentials = "${aws_iam_role.api_executor.arn}"
  request_templates {
    "application/json" = <<EOF
{"statusCode": 200}
EOF
  }
}


resource "aws_api_gateway_integration_response" "cors" {
  resource_id = "${aws_api_gateway_resource.proxy.id}"
  rest_api_id = "${aws_api_gateway_rest_api.bitwallet.id}"
  status_code = 200
  http_method = "${aws_api_gateway_method.cors.http_method}"
  //  response_templates = {
  //
  //  }
  response_parameters {
    method.response.header.Access-Control-Allow-Headers = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    method.response.header.Access-Control-Allow-Methods = "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
    method.response.header.Access-Control-Allow-Origin = "'*'"
    method.response.header.Access-Control-Expose-Headers = "'*'"
  }
}

resource "aws_api_gateway_method_response" "cors" {
  rest_api_id = "${aws_api_gateway_rest_api.bitwallet.id}"
  resource_id = "${aws_api_gateway_resource.proxy.id}"
  http_method = "${aws_api_gateway_method.cors.http_method}"
  status_code = "200"
  response_models = {
    "application/json" = "Empty"
  }
  response_parameters {
    method.response.header.Access-Control-Allow-Headers = true
    method.response.header.Access-Control-Allow-Methods = true
    method.response.header.Access-Control-Allow-Origin = true
    method.response.header.Access-Control-Expose-Headers = true
  }
}


//
// The following resource must be marked 'tainted' on most API Gateway changes.
// @see https://github.com/hashicorp/terraform/issues/6613
//
resource "aws_api_gateway_deployment" "production" {
  rest_api_id = "${aws_api_gateway_rest_api.bitwallet.id}"
  stage_name = "prod"
}

//
// The following resource must be marked 'tainted' on most API Gateway changes.
// @see https://github.com/hashicorp/terraform/issues/6613
//
resource "aws_api_gateway_api_key" "key" {
  name = "bitwallet_api_key"
  stage_key {
    rest_api_id = "${aws_api_gateway_rest_api.bitwallet.id}"
    stage_name = "${aws_api_gateway_deployment.production.stage_name}"
  }
}