FROM gliderlabs/alpine:3.6

RUN apk add --update \
nodejs=6.10.3-r0 \
nodejs-npm=6.10.3-r0 \
&& npm install -g npm@5.0.4 \
&& npm i -g pm2 \
&& rm -rf /var/cache/apk/*

WORKDIR /app
COPY . /app

RUN npm install && npm test && npm run build

ENTRYPOINT ["pm2-docker", "dist/server/app.js"]
