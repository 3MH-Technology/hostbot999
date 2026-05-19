#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api"
AUTH_TOKEN="white-wolf-auth-token"

echo "=== BotOps API Systematic Testing ==="

# 1. Test Auth Endpoint (Success)
echo -n "Test 1: Auth Login (Valid)... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API_URL/auth \
  -H "Content-Type: application/json" \
  -d '{"username": "moh777", "password": "Mm@123456"}')
if [ "$RESPONSE" == "200" ]; then echo "PASS"; else echo "FAIL ($RESPONSE)"; fi

# 2. Test Auth Endpoint (Failure)
echo -n "Test 2: Auth Login (Invalid)... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API_URL/auth \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "wrongpassword"}')
if [ "$RESPONSE" == "401" ]; then echo "PASS"; else echo "FAIL ($RESPONSE)"; fi

# 3. Test Unauthorized Access to Bots
echo -n "Test 3: Get Bots (No Auth Token - should fail)... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET $API_URL/bots)
if [ "$RESPONSE" == "401" ]; then echo "PASS"; else echo "FAIL ($RESPONSE)"; fi

# 4. Test Bot Creation (With Auth)
echo -n "Test 4: Create Bot (With Auth)... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API_URL/bots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"name": "TestBot", "language": "nodejs", "code": "console.log(1)"}')
if [ "$RESPONSE" == "200" ]; then echo "PASS"; else echo "FAIL ($RESPONSE)"; fi

# 5. Test System Metrics (With Auth)
echo -n "Test 5: Get System Metrics (With Auth)... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET $API_URL/system \
  -H "Authorization: Bearer $AUTH_TOKEN")
if [ "$RESPONSE" == "200" ]; then echo "PASS"; else echo "FAIL ($RESPONSE)"; fi

echo "=== Testing Completed ==="
