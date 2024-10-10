# Use the official Rust image as the base image
FROM rust:latest

# Set the working directory
WORKDIR /usr/src/app

# Install cargo-watch
RUN cargo install cargo-watch

# Copy the Cargo.toml and Cargo.lock files
COPY Cargo.toml Cargo.lock ./

# Copy the source code
COPY src ./src

# Build the dependencies
RUN cargo build --release

# Copy the source code
COPY . .

# Build the application
RUN cargo install --path .

# Expose the port the app runs on
EXPOSE 8080

# Run the application with cargo-watch
CMD ["cargo", "watch", "-x", "run"]
