# Recommended command to run this docker:
# docker run --cpus=.5 --memory=100m --name="dawid.niedzwiedzki.tech" -d -v /etc/nginx

# Node image using Alpine linux
FROM node:12

# Define port that will be used in this Docker
ARG port

# Define environmental variables for this container
ENV PORT $port

# Create and use working directory
ARG workdir_path=/srv
RUN mkdir -p $workdir_path
WORKDIR $workdir_path

# Copy list of NPM packages and clean install it
COPY ./cfg/package*.json ./
RUN npm ci

# Copy all other configuration files and leave out not needed ones
COPY ./*[^cfg] ./
RUN dir /srv/

# Start default process specified in package.json
CMD ["npm", "start"]