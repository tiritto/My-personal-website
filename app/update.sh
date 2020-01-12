# All operations will be done within /srv/ directory
echo "Starting remote update procedure..."
cd /srv

# Pull new changes from produnction branch from GitHub
echo "Pulling production branch files from GitHub..."
git pull origin production

# Perform clean install of all packages listed in package.json
echo "Performing clean install of NPM packages..."
npm ci

# Remove outdated files when updating the website
rm ./build --force --verbose --recursive
rm ./public --force --verbose --recursive



# Build new website  
echo "Removing old build files and replacing them with new build..."
npm build

# Replace public files with new build
echo "Replacing public directory with new content of new build..."
mv public public_old
mv build public

# Remove old public files
echo "Removing old ./public/ files..."

# Finally, restart watcher application in case it was changed
echo "Restarting watcher application..."
pm2 restart dawid.niedzwiedzki.tech

# It is done
echo "Deploy has been finished!"