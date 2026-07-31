FROM eclipse-temurin:17-jdk AS build

WORKDIR /workspace

COPY backend/.mvn .mvn
COPY backend/mvnw backend/pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw -B -DskipTests dependency:go-offline

COPY backend/src src
RUN ./mvnw -B -DskipTests package

FROM eclipse-temurin:17-jre

WORKDIR /app

ENV JAVA_OPTS=""

COPY --from=build /workspace/target/uniproxy-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 10000

CMD ["sh", "-c", "if [ -n \"${SPRING_DATASOURCE_URL:-}\" ]; then case \"$SPRING_DATASOURCE_URL\" in postgres://*) export SPRING_DATASOURCE_URL=\"jdbc:postgresql://${SPRING_DATASOURCE_URL#postgres://}\" ;; postgresql://*) export SPRING_DATASOURCE_URL=\"jdbc:postgresql://${SPRING_DATASOURCE_URL#postgresql://}\" ;; esac; elif [ -n \"${DATABASE_URL:-}\" ]; then case \"$DATABASE_URL\" in postgres://*) export SPRING_DATASOURCE_URL=\"jdbc:postgresql://${DATABASE_URL#postgres://}\" ;; postgresql://*) export SPRING_DATASOURCE_URL=\"jdbc:postgresql://${DATABASE_URL#postgresql://}\" ;; jdbc:*) export SPRING_DATASOURCE_URL=\"$DATABASE_URL\" ;; *) export SPRING_DATASOURCE_URL=\"$DATABASE_URL\" ;; esac; fi; exec java $JAVA_OPTS -Dserver.address=0.0.0.0 -Dserver.port=${PORT:-10000} -jar app.jar"]
