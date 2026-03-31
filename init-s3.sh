#!/bin/bash
echo "Loading LocalStack S3..."

awslocal s3 mb s3://clothes-shop-images

awslocal s3api put-bucket-acl --bucket clothes-shop-images --acl public-read

echo "bucket clothes-shop-images is enabled!"
