//           _                      _    _
//_ __   ___| |___      _____  _ __| | _(_)_ __   __ _
//| '_ \ / _ \ __\ \ /\ / / _ \| '__| |/ / | '_ \ / _` |
//| | | |  __/ |_ \ V  V / (_) | |  |   <| | | | | (_| |
//|_| |_|\___|\__| \_/\_/ \___/|_|  |_|\_\_|_| |_|\__, |
//|___/
//


//
// Networking is configured according to http://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/vpc-nat-gateway.html.

// Network fail-over is achieved by running lambda in 2 redundant subnets located in different AZs.

// For more information on CIDR and subnetting refer to http://www.faqs.org/rfcs/rfc1918.html
// and https://aws.amazon.com/answers/networking/aws-single-vpc-design/

variable "public" {
  default = "public"
}

variable "private" {
  default = "private"
}

variable "public_subnets" {
  type = "list"
  default = [
    "10.0.0.0/22",
    "10.0.4.0/22"
  ]
}

variable "private_subnets" {
  type = "list"
  default = [
    "10.0.8.0/22",
    "10.0.12.0/22"
  ]
}

resource "aws_vpc" "production" {
  cidr_block = "10.0.0.0/16"
  enable_dns_support = true
}

resource "aws_subnet" "public" {
  count = "${length(var.availabilityZones)}"
  vpc_id = "${aws_vpc.production.id}"
  cidr_block = "${element(var.public_subnets, count.index)}"
  availability_zone = "${element(var.availabilityZones, count.index)}"
}

resource "aws_subnet" "private" {
  count = "${length(var.availabilityZones)}"
  vpc_id = "${aws_vpc.production.id}"
  cidr_block = "${element(var.private_subnets, count.index)}"
  availability_zone = "${element(var.availabilityZones, count.index)}"
}

resource "aws_eip" "main" {
  count = 2
  vpc = true
}

resource "aws_nat_gateway" "gw" {
  count = "${length(var.availabilityZones)}"
  subnet_id = "${element(aws_subnet.public.*.id, count.index)}"
  allocation_id = "${element(aws_eip.main.*.id, count.index)}"
  depends_on = [
    "aws_internet_gateway.public"
  ]
}

resource "aws_internet_gateway" "public" {
  vpc_id = "${aws_vpc.production.id}"
}




//
// public subnet route tables
//

resource "aws_route_table" "public" {
  count = "${length(var.availabilityZones)}"
  vpc_id = "${aws_vpc.production.id}"
}

resource "aws_route_table_association" "public" {
  count = "${length(var.availabilityZones)}"
  subnet_id = "${element(aws_subnet.public.*.id, count.index)}"
  route_table_id = "${element(aws_route_table.public.*.id, count.index)}"
}

resource "aws_route" "public" {
  count = "${length(var.availabilityZones)}"
  route_table_id = "${element(aws_route_table.public.*.id, count.index)}"
  destination_cidr_block = "0.0.0.0/0"
  gateway_id = "${aws_internet_gateway.public.id}"
}




//
// private subnet route tables
//

resource "aws_route_table" "private" {
  count = "${length(var.availabilityZones)}"
  vpc_id = "${aws_vpc.production.id}"
}

resource "aws_route_table_association" "private" {
  count = "${length(var.availabilityZones)}"
  subnet_id = "${element(aws_subnet.private.*.id, count.index)}"
  route_table_id = "${element(aws_route_table.private.*.id, count.index)}"
}

resource "aws_route" "private" {
  count = "${length(var.availabilityZones)}"
  route_table_id = "${element(aws_route_table.private.*.id, count.index)}"
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id = "${element(aws_nat_gateway.gw.*.id, count.index)}"
}