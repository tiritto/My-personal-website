#!/bin/bash
WEBSITE="dawid.niedzwiedzki.tech"
echo "Building an image for $WEBSITE..."

# This script deploys website docker
BRANCH="development"
if [ -n "$1" ]; then
    BRANCH="$1"
    echo "This application will be deployed as '$1' branch."
else
    echo "Deployment branch was not specified. Development branch will be used."
fi

# Check if specified branch has configuration directory
if [! -f "./cfg/docker-compose.$BRANCH.yml"]; then
    echo "Error: Unable to locate configuration file for docker-compose! Apperantly '$BRANCH' branch is not supported right now!" >&2
    exit 1
fi

# Make sure that all required commands exist on host device 
if ! [ -x "$(command -v docker)"]; then
    echo 'Error: "docker" is not installed or is not executable.' >&2
    exit 2
elif ! [ -x "$(command -v docker-compose)"]; then
    echo 'Error: "docker-compose" is not installed or is not executable.' >&2
    exit 3
elif ! [ -x "$(command -v xargs)"]; then
    echo 'Error: "xargs" is not installed or is not executable.' >&2
    exit 4
fi

# Prepare environment-dependent configuration
if [ -d "current_configuration" ]; then
    rm --force --recursive ./current_configuration/* 
else
    mkdir ./current_configuration/
fi
cp ./cfg/* ./current_configuration
cp ./cfg/$BRANCH/* ./current_configuration

# Remove all perviously running containers containing this project
DOCKER_CONTAINER = "$(docker ps -aq -f name=$WEBSITE)"
if [ -z "$DOCKER_CONTAINER" ]; then
    docker stop $DOCKER_CONTAINER | xargs docker rm
fi

# Deploy via docker-compose using settings for current environment
docker-compose up --file ./cfg/docker-compose.defaults.yml --file ./cfg/docker-compose.$BRANCH.yml --build --force-recreate -d