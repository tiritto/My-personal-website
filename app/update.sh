# All operations will be done within /srv/ directory
echo "Starting remote update procedure..."
cd /srv

# Pull new changes from produnction branch from GitHub
echo "Pulling production branch files from GitHub..."
git pull origin production

# Perform clean install of all packages listed in package.json
echo "Performing clean install of NPM packages..."
npm ci

# Clear up previous ./build/ folder just in case
echo "Clearing out ./build/ directory..."
rm ./build/* --force --verbose --recursive

# Build new website  
echo "Building new website with Gulp..."
gulp build

# Replace public files with new build
echo "Replacing public directory with new build contents..."
mv public public_old
mv build public

# Remove old public files
echo "Removing previous ./public/ files..."
rm public -f -r -v

# Finally, restart watcher application in case it was changed
echo "Restarting watcher application..."
pm2 restart dawid.niedzwiedzki.tech

# It is done
echo "Deploy has been finished!"