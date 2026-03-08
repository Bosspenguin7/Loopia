#!/bin/bash
# Start server
echo "Starting server..."
cd server && npm run dev &
SERVER_PID=$!

# Start client
echo "Starting client..."
cd client && npm run dev &
CLIENT_PID=$!

# Cleanup on exit
trap "kill $SERVER_PID $CLIENT_PID" EXIT

wait
