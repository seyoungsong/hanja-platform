# pull updates
docker compose down
git pull

# deploy
docker compose down &&
    git pull &&
    docker compose up --remove-orphans --detach && docker compose logs --follow

# pull & build
docker compose down &&
    git pull &&
    docker compose pull &&
    docker compose build &&
    docker compose up --remove-orphans --detach && docker compose logs --follow

# clone repo (once)
git clone https://github.com/seyoungsong/hanja-platform

# acme.sh (once)
# Register account with ZeroSSL
docker exec hanja-acme acme.sh --register-account --server zerossl \
    --eab-kid "YOUR_KEY" \
    --eab-hmac-key "YOUR_KEY"
# Issue the certificate
docker exec hanja-acme acme.sh --issue --dns dns_cf --ocsp-must-staple --keylength 4096 \
    -d hanja.dev -d '*.hanja.dev'
# Install
docker exec hanja-acme acme.sh --install-cert -d hanja.dev \
    --cert-file /certs/cert.pem \
    --key-file /certs/key.pem \
    --ca-file /certs/ca.pem \
    --fullchain-file /certs/fullchain.pem
# Deploy the certificate using the docker deployment hook
docker exec hanja-acme acme.sh --deploy -d hanja.dev --deploy-hook docker
# For debugging/checking (if needed)
docker exec -it hanja-acme sh
