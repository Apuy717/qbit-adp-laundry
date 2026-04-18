# running for adp-alpha laundry
docker buildx build \
  --build-arg ENV_FILE=.env.alpha \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/apuy717/qbit-adp-alpha:latest \
  --push .

# running for adp-beta laundry
docker buildx build \
  --build-arg ENV_FILE=.env.beta \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/apuy717/qbit-adp-beta:latest \
  --push .

# running for adp-bossq laundry
docker buildx build \
  --build-arg ENV_FILE=.env.bossq \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/apuy717/qbit-adp-bossq:latest \
  --push .
  
# running for aqs laundry
docker buildx build \
  --build-arg ENV_FILE=.env.aqs \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/apuy717/qbit-adp-aqs:latest \
  --push .