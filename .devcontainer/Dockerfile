FROM alpine:3.23.3 AS fetcher

WORKDIR /fetcher

RUN \
  apk add --quiet curl unzip && \
  # Fetch task
  sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /fetcher v3.50.0 && \
  chmod +x ./task
  
# Use node as the base image
FROM node:24.14.0-trixie

# Install task
COPY --from=fetcher /fetcher/task /usr/local/bin/task

# Set environment variables
ENV DEBIAN_FRONTEND="noninteractive"

RUN set -e && \
    # Update and install system dependencies
    apt-get update -qq && \
    apt-get install -yqq --no-install-recommends \
        git wget curl zip unzip p7zip-full tree ripgrep && \
    # Clean up
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Add the startup script on every bash session
COPY .devcontainer/.bashrc /root/.bashrc

# Command just to keep the container running
CMD ["sleep", "infinity"]
