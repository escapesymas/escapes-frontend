#!/bin/bash
# Límite controlado para evitar proliferación de workers y OOM con Next.js 16
export NODE_OPTIONS="--max-old-space-size=1536"
export NEXT_TELEMETRY_DISABLED=1
exec npm run dev

