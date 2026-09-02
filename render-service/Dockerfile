# Base image ships Chromium + every system dep Playwright needs — so there is no
# @sparticuz/chromium, no brotli bin to trace, no serverless cold-start extraction.
# IMPORTANT: keep this tag in lockstep with the "playwright" version in package.json.
FROM mcr.microsoft.com/playwright:v1.61.1-jammy

# System ffmpeg for video encoding (Playwright's bundled ffmpeg is a minimal
# screencast build without the x264/vp9 encoders the /video endpoints need).
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    # Browsers are already baked into the image at the matching version.
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY server.mjs ./
COPY lib ./lib

EXPOSE 8080
CMD ["node", "server.mjs"]
