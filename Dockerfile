FROM gliderlabs/alpine:3.6

WORKDIR /build
COPY . /build

RUN apk add --update \
nodejs \
nodejs-npm \
&& rm -rf /var/cache/apk/* \
&& npm install -g npm@5.4.2 pm2 \
&& npm i \
&& npm run build \
&& mkdir -p -m 0777 /app/bin \
&& cp -R dist/* /app/bin \
&& cp package.json /app \
&& cd /app \
&& npm i --only="prod" \
&& rm -rf /build \
&& mkdir -p -m 0777 /var/log/ytradio \
&& npm cache clean --force

ENTRYPOINT ["pm2-docker", "/app/bin/server/app.js", "-l /var/log/ytradio/ytradio.logs"]
