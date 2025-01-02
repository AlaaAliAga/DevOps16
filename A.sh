#!/bin/bash

echo_log() {
  echo "$1"
  logger "$1"
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

echo_log "Updating package list and installing prerequisites."
sudo apt-get update -y && sudo apt-get install -y curl gnupg2 software-properties-common

if dpkg -l | grep -q jenkins; then
  echo_log "Jenkins is already installed."

  if systemctl is-active --quiet jenkins; then
    echo_log "Jenkins is running. Restarting it."
    sudo systemctl restart jenkins
  else
    echo_log "Jenkins is installed but not running. Starting Jenkins."
    sudo systemctl start jenkins
  fi
else
  echo_log "Jenkins is not installed. Proceeding with installation."

  curl -fsSL https://pkg.jenkins.io/debian/jenkins.io.key | sudo tee "/usr/share/keyrings/jenkins-keyring.asc" >/dev/null
  echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian binary/" | sudo tee "/etc/apt/sources.list.d/jenkins.list" >/dev/null

  sudo apt-get update -y && sudo apt-get install -y openjdk-11-jdk jenkins

  sudo systemctl start jenkins
  sudo systemctl enable jenkins

  echo_log "Jenkins installed and started successfully."
fi

if [ -f /var/lib/jenkins/secrets/initialAdminPassword ]; then
  INITIAL_ADMIN_PASSWORD=$(sudo cat /var/lib/jenkins/secrets/initialAdminPassword)
  echo_log "Initial Admin Password: $INITIAL_ADMIN_PASSWORD"
else
  echo_log "Initial Admin Password file not found. Jenkins might not be fully started yet."
fi

if ! command_exists docker; then
  echo_log "Docker is not installed. Installing Docker."
  curl -fsSL https://get.docker.com | sudo bash
else
  echo_log "Docker is already installed."
fi

if getent group docker | grep -q "jenkins"; then
  echo_log "Jenkins user is already in the Docker group."
else
  echo_log "Adding Jenkins user to the Docker group."
  sudo usermod -aG docker jenkins
fi

sudo systemctl restart jenkins

if sudo -u jenkins docker ps >/dev/null 2>&1; then
  echo_log "Jenkins user can use Docker."
else
  echo_log "Jenkins user does not have Docker permissions."
  exit 1
fi

echo_log "Jenkins setup complete. Jenkins is running and configured to use Docker."