#!/bin/bash
export VITE_COGNITO_AUTHORITY="https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eHQt8tfhs"
export VITE_COGNITO_CLIENT_ID="61h6kngqmjash5hv9m5gusvqa4"
export VITE_COGNITO_REDIRECT_URI="http://localhost:3000"
export VITE_API_BASE_URL="http://localhost:3000/api/trpc"

pnpm install
pnpm dev
