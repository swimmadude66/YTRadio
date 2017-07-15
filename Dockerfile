FROM gliderlabs/alpine:3.6

RUN apk add --update \
nodejs \
nodejs-npm \
&& npm install -g npm@5.2.0 \
&& npm i -g pm2 \
&& rm -rf /var/cache/apk/*

WORKDIR /app
COPY . /app

RUN npm install && npm test && npm run build

ENTRYPOINT ["pm2-docker", "dist/server/app.js"]
