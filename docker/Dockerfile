FROM postman/newman:6-alpine

WORKDIR /etc/newman

COPY collections/ ./collections/
COPY environments/ ./environments/
COPY data/ ./data/

RUN npm install -g newman-reporter-htmlextra

ENTRYPOINT ["newman"]
CMD ["run", "collections/regression.collection.json", \
     "--environment", "environments/staging.environment.json", \
     "--reporters", "cli,htmlextra", \
     "--reporter-htmlextra-export", "/reports/report.html"]
