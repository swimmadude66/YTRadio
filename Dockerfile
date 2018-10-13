FROM alpine:3.8

WORKDIR /build
COPY . /build

RUN apk add --no-cache --update \
nodejs \
nodejs-npm \
python2 \
g++ \
make \
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

WORKDIR /app

ENTRYPOINT ["node", "/app/bin/server/app.js", ">> /var/log/ytradio/ytradio.logs", "2>&1"]
