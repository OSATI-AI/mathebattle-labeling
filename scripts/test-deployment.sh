#!/bin/bash

echo "=== Mathebattle Labeling Deployment Test ==="
echo ""
echo "Testing deployment: mathebattle-labeling-nouuzs7mm-wielands-projects-edb6f5fe.vercel.app"
echo ""

# Get the production URL from vercel
PROD_URL="https://mathebattle-labeling-nouuzs7mm-wielands-projects-edb6f5fe.vercel.app"

echo "1. Testing if deployment is accessible..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL")
echo "   Homepage status code: $HTTP_CODE"
echo ""

echo "2. Testing /api/tasks endpoint..."
curl -s "$PROD_URL/api/tasks" | head -200
echo ""
echo ""

echo "3. Testing /api/standards/domains endpoint..."
curl -s "$PROD_URL/api/standards/domains" | head -100
echo ""
echo ""

echo "4. Checking Vercel environment variables..."
vercel env ls
echo ""

echo "5. Getting latest deployment info..."
vercel ls --prod | head -10
echo ""

echo "=== Test Complete ==="
