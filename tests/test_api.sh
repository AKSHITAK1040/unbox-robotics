#!/usr/bin/env bash

echo "=== GET /api/health ==="
curl -i -s http://localhost:3000/api/health
echo ""

echo "=== GET /api/speed/latest ==="
curl -i -s http://localhost:3000/api/speed/latest
echo ""

echo "=== GET /api/speed/history?limit=3 ==="
curl -i -s "http://localhost:3000/api/speed/history?limit=3"
echo ""

echo "=== POST /api/speed (valid: 55.4) ==="
curl -i -s -X POST -H "Content-Type: application/json" -d '{"speed": 55.4}' http://localhost:3000/api/speed
echo ""

echo "=== POST /api/speed (zero: 0) ==="
curl -i -s -X POST -H "Content-Type: application/json" -d '{"speed": 0}' http://localhost:3000/api/speed
echo ""

echo "=== POST /api/speed (negative: -10) ==="
curl -i -s -X POST -H "Content-Type: application/json" -d '{"speed": -10}' http://localhost:3000/api/speed
echo ""

echo "=== POST /api/speed (excessive: 500) ==="
curl -i -s -X POST -H "Content-Type: application/json" -d '{"speed": 500}' http://localhost:3000/api/speed
echo ""

echo "=== POST /api/speed (missing field) ==="
curl -i -s -X POST -H "Content-Type: application/json" -d '{}' http://localhost:3000/api/speed
echo ""

echo "=== POST /api/speed (null) ==="
curl -i -s -X POST -H "Content-Type: application/json" -d '{"speed": null}' http://localhost:3000/api/speed
echo ""

echo "=== POST /api/speed (string) ==="
curl -i -s -X POST -H "Content-Type: application/json" -d '{"speed": "fast"}' http://localhost:3000/api/speed
echo ""
