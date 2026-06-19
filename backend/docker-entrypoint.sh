#!/bin/sh
set -eu

if [ -n "${SPRING_DATASOURCE_URL:-}" ]; then
  case "$SPRING_DATASOURCE_URL" in
    postgres://*)
      export SPRING_DATASOURCE_URL="jdbc:postgresql://${SPRING_DATASOURCE_URL#postgres://}"
      ;;
    postgresql://*)
      export SPRING_DATASOURCE_URL="jdbc:postgresql://${SPRING_DATASOURCE_URL#postgresql://}"
      ;;
  esac
elif [ -n "${DATABASE_URL:-}" ]; then
  case "$DATABASE_URL" in
    postgres://*)
      export SPRING_DATASOURCE_URL="jdbc:postgresql://${DATABASE_URL#postgres://}"
      ;;
    postgresql://*)
      export SPRING_DATASOURCE_URL="jdbc:postgresql://${DATABASE_URL#postgresql://}"
      ;;
    jdbc:*)
      export SPRING_DATASOURCE_URL="$DATABASE_URL"
      ;;
    *)
      export SPRING_DATASOURCE_URL="$DATABASE_URL"
      ;;
  esac
fi

exec java $JAVA_OPTS -jar app.jar
