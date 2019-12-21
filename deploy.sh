# Pull new changes from produnction branch from GitHub
echo "Pulling produnction branch from GitHub..."
git pull origin production
echo "Pulling produnction branch from GitHub - Finished."

# Perform clean install of all packages listed in package.json
echo "Performing clean install of NPM packages..."
npm ci
echo "Performing clean install of NPM packages - Finished."

# Clear up previous ./build/ folder just in case
echo "Clearing out ./build/ directory..."
rm ./build/* -f -v 
echo "Clearing out ./build/ directory - Finished."

# Build new website
echo "Building new website with Gulp..."
gulp build
echo "Building new website with Gulp - Finished."

# Replace public files with new build
echo "Replacing public directory with new build contents..."
mv public public_old
mv build public
echo "Replacing public directory with new build contents - Finished."

# Remove old public files
echo "Removing previous ./public/ files..."
rm public -f -r -v
echo "Removing previous ./public/ files - Finished."

# Finally, restart watcher application in case it was changed
echo "Restarting watcher application..."
pm2 restart dawid.niedzwiedzki.tech
echo "Restarting watcher application - Finished."