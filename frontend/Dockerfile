# Use the official Flutter image as the base image
FROM ghcr.io/cirruslabs/flutter:3.24.3

# Install tmux, inotify-tools, and net-tools
RUN apt update
RUN apt install -y tmux inotify-tools net-tools

# Set the working directory
WORKDIR /app

# Copy the application source code and get the dependencies
COPY . .

# give permissions to the entrypoint.sh file
RUN chmod +x entrypoint.sh

# Get the dependencies
RUN flutter pub get

# Expose the port the app runs on
EXPOSE 80

ENTRYPOINT ["/bin/bash", "./entrypoint.sh"]
