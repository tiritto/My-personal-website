# Node image using Alpine linux
FROM node:13-alpine as base

# Create (if doesn't exist) and use working directory
RUN mkdir -p $workdir_path
WORKDIR /srv

###
### Development branch instructions
###
FROM base AS development 
RUN npm ci
CMD ["npm", "start"]

###
### Production branch instructions
###
FROM base AS production
COPY ./cfg/nginx.conf /etc/nginx/conf.d/dawid.niedzwiedzki.tech
COPY ./app/* /srv/
RUN npm ci

# Copy list of NPM packages and clean install it
COPY ./package*.json /srv/

# Start default process specified in package.json
CMD ["npm", "start"]