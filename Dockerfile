# Node image using Alpine linux
FROM node:12

# Create and set working directory
RUN mkdir -p /usr/src/dawid.niedzwiedzki.tech
WORKDIR /usr/src/dawid.niedzwiedzki.tech

# Copy list of NPM packages and clean install it
COPY package*.json ./
RUN npm ci

# Copy all project files into working directory
COPY . ./

# Listen to the network on port 3100 over TCP
EXPOSE 3100/tcp

# Start default process specified in package.json
CMD ["npm", "start"]

# docker run -e NODE_ENV=production --cpus=.5 --memory=100m --name="dawid.niedzwiedzki.tech" -d -v /etc/nginx