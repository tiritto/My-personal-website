#!/bin/bash

# This script deploys website docker
BRANCH="development"
if [ -n "$1" ]; then
    BRANCH="$1"
    echo "This application will be deployed as within '$1' branch."
else
    echo "Deployment branch was not specified. Development branch will be used."
fi

# Check if specified branch has configuration directory
if [! -d "./cfg/$BRANCH"]; then
    echo "Error: Unable to locate '$branch' configuration files. Directory './cfg/$branch/' does not exist!" >&2
    exit 3
fi

# Make sure that docker and docker-compose exist on host device 
if ! [ -x "$(command -v docker)"]; then
    echo 'Error: docker is not installed or is not executable.' >&2
    exit 1
fi
if ! [ -x "$(command -v docker-compose)"]; then
    echo 'Error: docker-compose is not installed or is not executable.' >&2
    exit 2
fi

# Deploy to docker-compose
docker-compose --file ./cfg/docker-compose.defaults.yml --file ./cfg/$BRANCH/docker-compose.yml