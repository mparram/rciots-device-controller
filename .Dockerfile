FROM registry.access.redhat.com/ubi8/nodejs-14:latest
USER root
WORKDIR /app
RUN chown -R 1001:0 /app
COPY package.json /app
RUN npm install
COPY . /app
USER 1001
CMD npm start