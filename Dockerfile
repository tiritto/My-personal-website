# Node image using Alpine linux
FROM node:13-alpine as base

# Create (if doesn't exist) and use working directory
RUN mkdir -p $workdir_path
WORKDIR /srv

RUN git

#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#
###
### Development branch instructions
##
##  Those instructrions are only supposed to be executed on development
##  environment. Unlike production deployment, this branch does:
##   - Use local files instead of pulling latest production files;
##   - Use "nodemon" to restart Node files if they get updated;
##   - Ignore Nginx configuration and creation of Git repository;
##
FROM base AS development 
RUN npm ci
CMD ["nodemon ", "index.js"]


#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#
###
### Production branch instructions
##
##  Those instructrions are only supposed to be executed on production
##  environment. Unlike development version, this branch does:
##   - Initializes local git repository for updating reasons;
##   - Always pulls newest production files over git, ignoring local files;
##   - Doesn't use "nodemon", instead using "pm2" for restarting;
##   - Provides Nginx configuration file for Nginx reverse proxy;
##
FROM base AS production

# Install and initialize local git repository
RUN apk add --no-cache git

# Initialize git repository for update reasons
RUN git init --quiet
RUN git remote add origin -f https://github.com/tiritto/dawid.niedzwiedzki.tech.git
RUN git config core.sparseCheckout true
RUN echo "app/" >> /srv/.git/info/sparse-checkout
RUN git pull origin production

# Upload (and overwrite already existing) Nginx configuration file
COPY ./cfg/nginx.conf /tmp/
RUN mv --force /tmp/nginx.conf /etc/nginx/conf.d/dawid.niedzwiedzki.tech
RUN rm /tmp/nginx.conf


# Pull newest files from production branch


RUN npm ci

# pull na produkcji

# Copy list of NPM packages and clean install it
COPY ./package*.json /srv/

# Start default process specified in package.json
CMD ["npm", "start"]