FROM node:18-slim

# Install Google Chrome
RUN apt-get update && apt-get install -y wget gnupg ca-certificates --no-install-recommends && \
  wget -q -O /tmp/google-chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
  apt-get install -y /tmp/google-chrome.deb --no-install-recommends && \
  rm /tmp/google-chrome.deb && \
  rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["node", "scrape.js"]