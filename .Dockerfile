FROM registry.access.redhat.com/ubi8/nodejs-14:latest
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
CMD npm start