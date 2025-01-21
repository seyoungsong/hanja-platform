# install node
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install --lts
npm install

npx create-remix@latest

npx shadcn@latest init -d
npx shadcn@latest add --all

npm install --verbose openai pocketbase react-text-annotate-blend dotenv-cli

# Create data directory
sudo apt install sqlite3
rm -rf data
mkdir data
sqlite3 data/sqlite.db <schema.sql
