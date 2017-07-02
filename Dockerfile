FROM gliderlabs/alpine:3.6

RUN apk add --update \
nodejs=6.10.3-r0 \
nodejs-npm=6.10.3-r0 \
&& npm install -g npm@5.0.4 \
&& rm -rf /var/cache/apk/*

COPY . /build
WORKDIR /build

RUN npm install && npm test && npm run build

WORKDIR /app

RUN cp /build/package*.json . \
&& cp -R /build/dist/ ./ \
&& npm i --only=prod \
&& rm -rf /build
