FROM gliderlabs/alpine:3.6

ENV PROD_MODE=true

WORKDIR /app
COPY . /app

RUN apk add --update \
nodejs \
nodejs-npm \
&& rm -rf /var/cache/apk/* \
&& npm install -g npm \
&& npm i -g pm2 \
&& npm install \
&& npm test \
&& npm run build

ENTRYPOINT ["pm2-docker", "/app/dist/server/app.js"]
