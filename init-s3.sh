#!/bin/bash
echo "Loading LocalStack S3..."

if awslocal s3api head-bucket --bucket clothes-shop-images 2>/dev/null; then
  echo "Bucket clothes-shop-images already exists. Skipping creation."
else
  echo "Bucket not found. Creating..."
  awslocal s3 mb s3://clothes-shop-images
  awslocal s3api put-bucket-acl --bucket clothes-shop-images --acl public-read
  echo "Bucket clothes-shop-images is created and enabled!"
fi
