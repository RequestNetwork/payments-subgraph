#! /bin/bash

if [ -z "$TOKEN" ]; then
  echo "TOKEN is required"; 
  exit 1;
fi
if [ -z "$1" ]; then
  echo "A positional argument is required. Example: $0 rinkeby."
  exit 1;
fi

echo "Deploying requestnetwork/request-payments-$1"

yarn deploy requestnetwork/request-payments-$1  --access-token $TOKEN ./subgraph.$1.yaml
